import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Exam, Student, Marks, ClassSession, Attendance } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';
import { getDayRange } from '@/lib/dateRange';
import { sortByIndexNumber } from '@/lib/studentOrder';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const exam = await Exam.findById(id).populate('batchId', 'name');
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    // Same roster shape as GET /api/classes/[id]: eligible students by
    // batch+grade, left-joined with whatever marks already exist for this exam.
    //
    // Eligibility matches the class roster (active, and registered on or before
    // the exam date) rather than the whole batch — this used to list deactivated
    // students and mid-batch registrants who were never enrolled when the paper
    // was sat. The `$or` on _id is what keeps that safe: anyone who already has
    // a mark for this exam stays on the roster even if they have since been
    // deactivated, so their recorded score never becomes invisible and
    // uneditable.
    const marks = await Marks.find({ examId: id });
    const markedStudentIds = marks.map((m) => m.studentId);

    const students = await Student.find({
      batchId: exam.batchId,
      grade: exam.grade,
      $or: [
        { _id: { $in: markedStudentIds } },
        {
          $and: [
            { isActive: true },
            {
              $or: [
                { registrationDate: { $exists: false } },
                { registrationDate: { $lte: exam.examDate } },
              ],
            },
          ],
        },
      ],
    });

    // Absences carried over from that day's register. See buildAbsenceHints().
    const absenceHints = await buildAbsenceHints(exam, students);

    const roster = sortByIndexNumber(students).map((student) => {
      const studentId = student._id.toString();
      const mark = marks.find((m) => m.studentId.toString() === studentId);
      return {
        student,
        mark: mark ?? null,
        isRecorded: Boolean(mark),
        // A hint only — never a saved Marks row. The UI pre-ticks the Absent box
        // for these and waits for staff to confirm, because missing the class is
        // not the same fact as missing the paper. Suppressed once a mark exists,
        // so an entered score is never second-guessed by the register.
        suggestedAbsent: !mark && absenceHints.absentStudentIds.has(studentId),
      };
    });

    return NextResponse.json({ exam, roster, attendance: absenceHints.summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * Works out which students to pre-tick as absent on the marks sheet, from the
 * register for the exam's own date.
 *
 * The rule is narrower than it first looks, and deliberately so:
 *
 * - Only an *explicitly marked* absence counts (Attendance.countedAsLeave).
 *   Attendance has three states, not two — present, marked absent, and never
 *   marked at all — because the scanner only ever marks students present, so a
 *   no-show leaves no row. Treating "no row" as absent would pre-tick the whole
 *   roster on any day staff forgot to close the register.
 * - A student who was present at any of the day's sessions is not absent, even
 *   if they missed another one.
 * - No sessions that day means no hints at all, which is the "exam created
 *   before attendance was taken" case: nothing to carry over, so nothing is
 *   pre-ticked. Note this keys off whether the register exists *now*, not off
 *   which record was created first — an exam scheduled in the morning and
 *   registered in the evening still picks the absences up afterwards.
 */
async function buildAbsenceHints(exam: any, students: any[]) {
  const { start, end } = getDayRange(exam.examDate);

  const sessions = await ClassSession.find({
    batchId: exam.batchId,
    grade: exam.grade,
    date: { $gte: start, $lt: end },
  });

  const summary = {
    sessionCount: sessions.length,
    date: exam.examDate,
    suggestedAbsentCount: 0,
  };
  const absentStudentIds = new Set<string>();
  if (sessions.length === 0) return { absentStudentIds, summary };

  const sessionIds = sessions.map((s) => s._id.toString());
  const records = await Attendance.find({ classId: { $in: sessionIds } });

  for (const student of students) {
    const studentId = student._id.toString();
    const own = records.filter((r) => r.studentId.toString() === studentId);
    const wasPresentSomewhere = own.some((r) => r.present);
    const wasMarkedAbsent = own.some((r) => r.countedAsLeave);
    if (wasMarkedAbsent && !wasPresentSomewhere) absentStudentIds.add(studentId);
  }

  summary.suggestedAbsentCount = absentStudentIds.size;
  return { absentStudentIds, summary };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    const data = await request.json();

    const update: Record<string, unknown> = {};
    if (data.subject !== undefined) update.subject = data.subject;
    if (data.grade !== undefined) update.grade = data.grade;
    if (data.batchId !== undefined) update.batchId = data.batchId;
    if (data.examDate !== undefined) update.examDate = data.examDate;
    if (data.maxMarks !== undefined) update.maxMarks = data.maxMarks;
    if (data.name !== undefined) update.name = data.name;
    // The gate for the public /results lookup. publishedAt records when this
    // was last made visible to parents and is cleared on unpublish, so "when
    // could parents first see this" is answerable without digging through logs.
    if (data.isPublished !== undefined) {
      update.isPublished = Boolean(data.isPublished);
      update.publishedAt = data.isPublished ? new Date() : null;
    }

    // Editing maxMarks does not rescale marks already entered — each Marks row
    // keeps the maxMarks value it was recorded with, same as before Exam existed.
    const exam = await Exam.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    return NextResponse.json({ exam });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const exam = await Exam.findByIdAndDelete(id);
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    // Deliberate exception to the block-if-referenced policy used for
    // Batch/ClassSession/Student: marks entered through this exam only exist
    // because this exam created them (unlike Attendance, which is ground
    // truth from a different workflow — the scanner), so cascade is safe.
    await Marks.deleteMany({ examId: id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
