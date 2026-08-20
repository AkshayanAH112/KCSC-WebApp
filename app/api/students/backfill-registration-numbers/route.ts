import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Student, Counter } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';

/**
 * One-time, idempotent migration for Student docs that predate the
 * registrationNumber field. Groups by (batch year, or createdAt year if no
 * batch), orders each group by createdAt ascending, assigns sequential
 * numbers, and seeds each year's Counter so future live creates continue
 * correctly. registrationDate is set to createdAt as the best available
 * stand-in for students who existed before that field did either.
 *
 * Filtering on registrationNumber: { $exists: false } makes reruns a safe
 * no-op — can be re-triggered if interrupted.
 */
export async function POST(request: Request) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();

    const unmigrated = await Student.find({ registrationNumber: { $exists: false } })
      .populate('batchId')
      .sort({ createdAt: 1 });

    const groups = new Map<number, typeof unmigrated>();
    for (const student of unmigrated) {
      const year = student.batchId?.year ?? student.createdAt.getFullYear();
      const group = groups.get(year) ?? [];
      group.push(student);
      groups.set(year, group);
    }

    let studentsUpdated = 0;

    for (const [year, group] of groups) {
      for (const student of group) {
        const counter = await Counter.findOneAndUpdate(
          { _id: `regno-${year}` },
          { $inc: { seq: 1 } },
          { upsert: true, new: true }
        );
        await Student.findByIdAndUpdate(student._id, {
          registrationNumber: `KCSC/${year}/${String(counter.seq).padStart(4, '0')}`,
          registrationDate: student.registrationDate ?? student.createdAt,
        });
        studentsUpdated += 1;
      }
    }

    return NextResponse.json({ studentsUpdated, years: Array.from(groups.keys()) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
