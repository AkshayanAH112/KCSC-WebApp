import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Student, ClassSession, Attendance, Marks } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

/**
 * Per-student ranking over an arbitrary date range, combining exam results and
 * attendance — neither exists as a standalone report anywhere else. Roster
 * matching for attendance mirrors app/api/dashboard/stats/route.ts's approach
 * (students matched to sessions by (batchId, grade), scored against recorded
 * Attendance rows for those exact sessions) rather than a blind date scan,
 * extended here with a caller-supplied date range instead of "today".
 *
 * GET /api/analysis?start=2026-06-12&end=2026-07-12&grade=3&batchId=...
 */
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

    const [marksInRange, sessionsInRange] = await Promise.all([
      Marks.find(marksQuery),
      ClassSession.find(sessionQuery),
    ]);

    // Marks: average % per student.
    const marksByStudent = new Map<string, { total: number; count: number }>();
    for (const m of marksInRange) {
      const key = m.studentId.toString();
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
          (s) => s.batchId?.toString() === session.batchId.toString() && s.grade === session.grade
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
      return NextResponse.json({ students: [] });
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

      return {
        studentId: key,
        name: s.name,
        grade: s.grade,
        examCount: m?.count ?? 0,
        avgMarksPercent,
        attendancePercent,
        combinedScore,
        partial: parts.length < 2,
      };
    });

    results.sort((a, b) => (b.combinedScore ?? -1) - (a.combinedScore ?? -1));

    return NextResponse.json({
      students: results,
      range: { start: start.toISOString(), end: end.toISOString() },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
