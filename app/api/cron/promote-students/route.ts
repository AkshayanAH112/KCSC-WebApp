import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Batch, Student } from '@/models';

const GRADES = [3, 4, 5];

/**
 * Yearly grade rollover for multi-year batches (e.g. a "2027 Scholarship
 * Batch" that enrolls students in Grade 4 and carries the same students into
 * Grade 5 the following January) — same Student document, same
 * registrationNumber/qrCode, no new batch, no duplication. Only batches with
 * `autoPromote: true` are touched; `grades` alone doesn't imply this (a batch
 * can list multiple grades just because it teaches separate cohorts side by
 * side).
 *
 * currentLeaveCycle/cycleGeneration reset exactly like reactivation does
 * (see PATCH /api/students/[id]) so the 2-leave/3-leave warnings start fresh
 * for the new grade; totalLeaves (lifetime) is deliberately left untouched.
 * Grade 5 students are naturally left alone since 6 isn't a valid grade —
 * moving them off the active roster after their scholarship exam stays a
 * separate, manual step (isActive toggle).
 *
 * Triggered by Vercel Cron (see vercel.json) once yearly. The January guard
 * below is belt-and-suspenders: a stray manual call any other month is a
 * safe no-op, and re-running within January is also safe — once a student's
 * grade flips, they no longer match the `grade: g` filter, so nothing here
 * double-applies.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (new Date().getUTCMonth() !== 0) {
    return NextResponse.json({ skipped: 'Not January', promotions: [] });
  }

  try {
    await connectToDatabase();

    const batches = await Batch.find({ autoPromote: true });
    const promotions: { batchId: string; batchName: string; fromGrade: number; toGrade: number; promotedCount: number }[] = [];

    for (const batch of batches) {
      const grades: number[] = [...batch.grades].sort((a, b) => a - b);
      for (const fromGrade of grades) {
        const toGrade = fromGrade + 1;
        if (!GRADES.includes(toGrade) || !grades.includes(toGrade)) continue;

        const result = await Student.updateMany(
          { batchId: batch._id, grade: fromGrade, isActive: true },
          { $set: { grade: toGrade, currentLeaveCycle: 0 }, $inc: { cycleGeneration: 1 } }
        );

        if (result.modifiedCount > 0) {
          promotions.push({
            batchId: batch._id.toString(),
            batchName: batch.name,
            fromGrade,
            toGrade,
            promotedCount: result.modifiedCount,
          });
        }
      }
    }

    return NextResponse.json({ promotions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
