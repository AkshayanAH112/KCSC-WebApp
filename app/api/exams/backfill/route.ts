import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Exam, Marks } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';

/**
 * One-time, idempotent migration for Marks rows that predate the Exam model.
 * Groups by (subject, grade, batchId, examDate day) — the exact key the old
 * Marks admin page used to synthesize "exams" client-side — creates one Exam
 * per group, and stamps examId onto that group's rows.
 *
 * Rows with no batchId (legacy data from before that field existed either,
 * per the Marks model's own comment) are deliberately left unmigrated rather
 * than force-fit into a fabricated exam.
 *
 * Filtering on examId: { $exists: false } makes re-running this a safe no-op
 * for anything already migrated, so it can be re-triggered if interrupted.
 */
export async function POST(request: Request) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();

    const unmigrated = await Marks.find({ examId: { $exists: false }, batchId: { $ne: null } });

    const groups = new Map<string, typeof unmigrated>();
    for (const mark of unmigrated) {
      const key = [mark.subject, mark.grade, mark.batchId?.toString(), mark.examDate.toDateString()].join('|');
      const group = groups.get(key) ?? [];
      group.push(mark);
      groups.set(key, group);
    }

    let examsCreated = 0;
    let marksUpdated = 0;
    const warnings: string[] = [];

    for (const [key, group] of groups) {
      const first = group[0];
      const maxMarksValues = new Set(group.map((m) => m.maxMarks));
      if (maxMarksValues.size > 1) {
        warnings.push(`Group ${key} has mixed maxMarks values (${[...maxMarksValues].join(', ')}); used ${first.maxMarks}`);
      }

      const exam = await Exam.create({
        subject: first.subject,
        grade: first.grade,
        batchId: first.batchId,
        examDate: first.examDate,
        maxMarks: first.maxMarks,
        name: first.examName,
      });
      examsCreated += 1;

      const result = await Marks.updateMany(
        { _id: { $in: group.map((m) => m._id) } },
        { examId: exam._id }
      );
      marksUpdated += result.modifiedCount;
    }

    const skipped = await Marks.countDocuments({ examId: { $exists: false }, batchId: null });

    return NextResponse.json({ examsCreated, marksUpdated, skippedNoBatch: skipped, warnings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
