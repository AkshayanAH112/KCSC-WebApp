import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Student, ClassSession, Attendance, Marks, Exam } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

/**
 * Per-student ranking over an arbitrary date range, combining exam results and
 * attendance — neither exists as a standalone report anywhere else. Roster
 * matching for attendance mirrors app/api/dashboard/stats/route.ts's approach
 * (students matched to sessions by (batchId, grade), scored against recorded
 * Attendance rows for those exact sessions) rather than a blind date scan,
 * extended here with a caller-supplied date range instead of "today".
 *
 * Exams are the main criterion and attendance is secondary. Ranking is tiered
 * by the number of exams sat (3, 2, 1, 0 — most first), then by exam average,
 * with attendance only breaking ties. Otherwise a student who skipped a hard
 * paper averages over fewer exams and outranks one who sat them all, and a
 * student who sat none could top the list on attendance alone. Students with
 * no exams sat are still listed, last, ordered by attendance.
 *
 * Tiering is by exams *sat*, not exams missed: a student counted as expected
 * to sit nothing (joined after the exams, or a batch with no exams in range)
 * has missed nothing, and would otherwise land in the top tier.
 *
 * combinedScore and partial are still returned for app builds that display
 * them, but no longer affect the order.
 *
 * GET /api/analysis?start=2026-06-12&end=2026-07-12&grade=3&batchId=...
 */

/** Identifies one exam across Exam docs and the Marks rows pointing at it.
 * Legacy rows predating the Exam model have no examId, so they are keyed on
 * the fields POST /api/marks upserts by. */
function examKeyOf(m: { examId?: unknown; subject: string; examDate: Date; grade: number; batchId?: unknown }) {
  if (m.examId) return String(m.examId);
  return `legacy:${m.subject}|${new Date(m.examDate).toISOString()}|${m.grade}|${m.batchId ?? ''}`;
}

const groupKeyOf = (batchId: unknown, grade: number) => `${batchId ?? ''}|${grade}`;

type ExamInfo = {
  key: string;
  label: string; // Exam.name, else the subject
  subject: string;
  examDate: Date;
  maxMarks: number;
  grade: number;
};

/** One student's result on one exam they were expected to sit. `marks` is
 * null unless they sat it — the 0 that Marks stores for an absent student
 * isn't a score. */
type StudentExamResult = {
  examKey: string;
  status: 'sat' | 'absent' | 'missing';
  marks: number | null;
  maxMarks: number;
};
export async function GET(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    if (!startParam || !endParam) {
      return NextResponse.json({ error: 'start and end dates are required' }, { status: 400 });
    }
    const start = new Date(startParam);
    const end = new Date(endParam);
    end.setUTCHours(23, 59, 59, 999);

    const grade = searchParams.get('grade');
    const batchId = searchParams.get('batchId');

    const marksQuery: Record<string, unknown> = { examDate: { $gte: start, $lte: end } };
    if (grade) marksQuery.grade = Number(grade);
    if (batchId) marksQuery.batchId = batchId;

    const sessionQuery: Record<string, unknown> = { date: { $gte: start, $lte: end } };
    if (grade) sessionQuery.grade = Number(grade);
    if (batchId) sessionQuery.batchId = batchId;

    // Exam shares the same date/grade/batch field names as Marks.
    const [marksInRange, sessionsInRange, examsInRange] = await Promise.all([
      Marks.find(marksQuery),
      ClassSession.find(sessionQuery),
      Exam.find(marksQuery),
    ]);

    // Exams held per (batchId, grade), with their dates, so a student who has
    // no Marks row at all for an exam still counts as having missed it. Marks
    // rows are folded in too, so legacy exams with no Exam doc are counted.
    const examsByGroup = new Map<string, Map<string, Date>>();
    const examInfo = new Map<string, ExamInfo>();
    const addExam = (groupKey: string | null, info: ExamInfo) => {
      if (!examInfo.has(info.key)) examInfo.set(info.key, info);
      if (groupKey === null) return;
      const exams = examsByGroup.get(groupKey) ?? new Map<string, Date>();
      exams.set(info.key, info.examDate);
      examsByGroup.set(groupKey, exams);
    };
    for (const e of examsInRange) {
      addExam(groupKeyOf(e.batchId, e.grade), {
        key: e._id.toString(),
        label: e.name || e.subject,
        subject: e.subject,
        examDate: e.examDate,
        maxMarks: e.maxMarks,
        grade: e.grade,
      });
    }

    // Marks: average % per student. Absent entries are excluded — they aren't
    // a score to average in — but every row, absent or not, marks that exam as
    // one the student was expected to sit.
    const marksByStudent = new Map<string, { total: number; count: number }>();
    const rowsByStudent = new Map<string, Map<string, { marks: number; isAbsent: boolean; maxMarks: number }>>();
    for (const m of marksInRange) {
      const key = m.studentId.toString();
      const examKey = examKeyOf(m);
      addExam(m.batchId ? groupKeyOf(m.batchId, m.grade) : null, {
        key: examKey,
        label: m.examName || m.subject,
        subject: m.subject,
        examDate: m.examDate,
        maxMarks: m.maxMarks,
        grade: m.grade,
      });
      const rows = rowsByStudent.get(key) ?? new Map();
      rows.set(examKey, { marks: m.marks, isAbsent: !!m.isAbsent, maxMarks: m.maxMarks });
      rowsByStudent.set(key, rows);

      if (m.isAbsent) continue;
      const percent = (m.marks / m.maxMarks) * 100;
      const entry = marksByStudent.get(key) ?? { total: 0, count: 0 };
      entry.total += percent;
      entry.count += 1;
      marksByStudent.set(key, entry);
    }

    // Attendance: roster per session by (batchId, grade), scored against actual
    // Attendance rows for those sessions — same approach as the dashboard stat.
    const attendanceByStudent = new Map<string, { attended: number; total: number }>();
    if (sessionsInRange.length > 0) {
      const sessionIds = sessionsInRange.map((s) => s._id.toString());
      const [rosterStudents, attendanceRecords] = await Promise.all([
        Student.find({ $or: sessionsInRange.map((s) => ({ batchId: s.batchId, grade: s.grade })) }),
        Attendance.find({ classId: { $in: sessionIds } }),
      ]);

      for (const session of sessionsInRange) {
        const roster = rosterStudents.filter(
          (s) =>
            s.batchId?.toString() === session.batchId.toString() &&
            s.grade === session.grade &&
            (!s.registrationDate || s.registrationDate <= session.date)
        );
        for (const student of roster) {
          const key = student._id.toString();
          const entry = attendanceByStudent.get(key) ?? { attended: 0, total: 0 };
          entry.total += 1;
          const record = attendanceRecords.find(
            (a) => a.studentId.toString() === key && a.classId.toString() === session._id.toString()
          );
          if (record?.present) entry.attended += 1;
          attendanceByStudent.set(key, entry);
        }
      }
    }

    const studentIds = new Set([...marksByStudent.keys(), ...attendanceByStudent.keys()]);
    if (studentIds.size === 0) {
      return NextResponse.json({ students: [], exams: [] });
    }
    const students = await Student.find({ _id: { $in: Array.from(studentIds) } });

    const results = students.map((s) => {
      const key = s._id.toString();
      const m = marksByStudent.get(key);
      const a = attendanceByStudent.get(key);
      const avgMarksPercent = m ? Math.round(m.total / m.count) : null;
      const attendancePercent = a && a.total > 0 ? Math.round((a.attended / a.total) * 100) : null;

      const parts = [avgMarksPercent, attendancePercent].filter((v): v is number => v !== null);
      const combinedScore = parts.length > 0 ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : null;

      // Exams this student was expected to sit: those held for their batch and
      // grade on/after they registered (same cutoff as the class roster), plus
      // any exam they have a row for — which covers legacy rows with no
      // batchId and exams sat under a previous grade before promotion.
      const rows = rowsByStudent.get(key);
      const expected = new Set(rows?.keys());
      for (const [examKey, date] of examsByGroup.get(groupKeyOf(s.batchId, s.grade)) ?? []) {
        if (!s.registrationDate || s.registrationDate <= date) expected.add(examKey);
      }
      const examsSat = m?.count ?? 0;
      const examsTotal = expected.size;

      const exams: StudentExamResult[] = Array.from(expected)
        .map((examKey) => {
          const row = rows?.get(examKey);
          const info = examInfo.get(examKey)!;
          if (!row) return { examKey, status: 'missing' as const, marks: null, maxMarks: info.maxMarks };
          if (row.isAbsent) return { examKey, status: 'absent' as const, marks: null, maxMarks: row.maxMarks };
          return { examKey, status: 'sat' as const, marks: row.marks, maxMarks: row.maxMarks };
        })
        .sort((a, b) => examInfo.get(a.examKey)!.examDate.getTime() - examInfo.get(b.examKey)!.examDate.getTime());

      return {
        studentId: key,
        name: s.name,
        school: s.school || null,
        grade: s.grade,
        exams,
        examCount: examsSat,
        examsSat,
        examsTotal,
        examsMissed: examsTotal - examsSat,
        avgMarksPercent,
        attendancePercent,
        combinedScore,
        partial: parts.length < 2,
      };
    });

    // Most exams sat first (3, 2, 1, 0), then exam average, then attendance as
    // the tie-break. Compared on the rounded figures the report displays, so a
    // tie on screen is a tie in the order.
    results.sort(
      (a, b) =>
        b.examsSat - a.examsSat ||
        (b.avgMarksPercent ?? -1) - (a.avgMarksPercent ?? -1) ||
        (b.attendancePercent ?? -1) - (a.attendancePercent ?? -1)
    );

    // Every exam that appears on at least one returned student, in date order —
    // the column set for the report. An exam with no expected student in the
    // result (e.g. scheduled for a batch with no roster yet) is left out.
    const examKeysInResults = new Set(results.flatMap((r) => r.exams.map((e) => e.examKey)));
    const exams = Array.from(examInfo.values())
      .filter((e) => examKeysInResults.has(e.key))
      .sort((a, b) => a.examDate.getTime() - b.examDate.getTime() || a.label.localeCompare(b.label));

    return NextResponse.json({
      students: results,
      exams,
      range: { start: start.toISOString(), end: end.toISOString() },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
