import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Student, Attendance } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';

/**
 * One-time, idempotent migration: counts each student's pre-existing
 * present:false Attendance rows into the new totalLeaves/currentLeaveCycle
 * counters, and stamps countedAsLeave on those rows so POST /api/attendance's
 * transition math (see route comment there) treats them as already accounted
 * for. Deliberately does NOT replay through POST /api/attendance — this must
 * not fire any 2-leave/3-leave notification retroactively for history that
 * predates the feature; only a genuinely new future leave can cross a
 * threshold and notify (confirmed rollout decision).
 *
 * Idempotent: rows already countedAsLeave are skipped, so a rerun only picks
 * up any historical present:false rows a first run may have missed.
 */
export async function POST(request: Request) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();

    const students = await Student.find({});
    let studentsUpdated = 0;
    let rowsStamped = 0;

    for (const student of students) {
      const result = await Attendance.updateMany(
        { studentId: student._id, present: false, countedAsLeave: { $ne: true } },
        { countedAsLeave: true }
      );
      rowsStamped += result.modifiedCount;

      const totalLeaveRows = await Attendance.countDocuments({ studentId: student._id, countedAsLeave: true });
      if (totalLeaveRows !== student.totalLeaves || totalLeaveRows !== student.currentLeaveCycle) {
        await Student.findByIdAndUpdate(student._id, {
          totalLeaves: totalLeaveRows,
          currentLeaveCycle: totalLeaveRows,
        });
        studentsUpdated += 1;
      }
    }

    return NextResponse.json({ studentsUpdated, rowsStamped, totalStudents: students.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
