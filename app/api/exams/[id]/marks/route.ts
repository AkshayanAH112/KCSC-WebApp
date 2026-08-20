import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Exam, Marks } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

/**
 * One entry point for both add-marks flows: the Web app's Excel bulk-upload
 * posts an array here; the mobile per-student form posts one entry at a time.
 * Upserts by {examId, studentId} and denormalizes subject/examDate/maxMarks/
 * grade/batchId from the parent Exam onto every row.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const exam = await Exam.findById(id);
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    const data = await request.json();
    const entries = Array.isArray(data) ? data : [data];

    for (const entry of entries) {
      await Marks.findOneAndUpdate(
        { examId: id, studentId: entry.studentId },
        {
          studentId: entry.studentId,
          marks: entry.marks,
          examId: id,
          subject: exam.subject,
          examDate: exam.examDate,
          maxMarks: exam.maxMarks,
          grade: exam.grade,
          batchId: exam.batchId,
        },
        { upsert: true, runValidators: true }
      );
    }

    return NextResponse.json({ success: true, count: entries.length }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
