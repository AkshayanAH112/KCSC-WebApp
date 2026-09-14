import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ClassSession, Student, Attendance } from '@/models';
import { getAuthPayload } from '@/lib/auth-guard';
import { sortByIndexNumber } from '@/lib/studentOrder';
import { recordAttendance } from '@/lib/attendance-recorder';

/**
 * Closes the register for one class session.
 *
 * The scanner only ever marks students *present*, so a no-show simply leaves no
 * Attendance row at all. That student drags down the attendance percentage but
 * never becomes a leave, never increments totalLeaves, and never raises a
 * 2/3-leave warning. This is the action that resolves that gap: every roster
 * student still without a row is marked absent, through the same
 * recordAttendance() path a manual absent mark uses, so leaves and parent
 * warnings come out identical either way.
 *
 * Safe to run twice. Students already marked (present or absent) are left
 * untouched, and recordAttendance()'s transition math means re-marking an
 * already-absent student counts no second leave.
 *
 * GET returns the preview the confirmation dialog shows before any write.
 */

/** Roster for a session: same grade + batch, and eligible on that date. */
async function getRoster(session: any) {
  const students = await Student.find({
    batchId: session.batchId,
    grade: session.grade,
    isActive: true,
  }).then(sortByIndexNumber);

  // Mirrors /api/attendance/today and /api/dashboard/stats — a mid-batch
  // registrant is not on the roster for classes predating their registration,
  // so ending the class must not hand them a leave for one they never owed.
  return students.filter((s: any) => !s.registrationDate || s.registrationDate <= session.date);
}

async function getUnmarked(session: any) {
  const roster = await getRoster(session);
  const records = await Attendance.find({ classId: session._id.toString() });
  const markedIds = new Set(records.map((r: any) => r.studentId.toString()));
  return roster.filter((s: any) => !markedIds.has(s._id.toString()));
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAuthPayload(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await params;

    const session = await ClassSession.findById(id);
    if (!session) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    const unmarked = await getUnmarked(session);

    return NextResponse.json({
      endedAt: session.endedAt ?? null,
      unmarkedCount: unmarked.length,
      unmarked: unmarked.map((s: any) => ({
        _id: s._id,
        name: s.name,
        registrationNumber: s.registrationNumber,
        // Shown in the dialog so an admin can see who is about to cross a
        // threshold before confirming — 1 here means this leave makes it 2.
        currentLeaveCycle: s.currentLeaveCycle ?? 0,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await params;

    const session = await ClassSession.findById(id);
    if (!session) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    const unmarked = await getUnmarked(session);

    // Sequential, not Promise.all: recordAttendance() does a read-modify-write
    // on the student's leave counters, so two concurrent writes to the same
    // student could interleave. Rosters are tens of students, not thousands.
    const markedAbsent: { name: string; leaveCycle: number }[] = [];
    for (const student of unmarked) {
      const { student: updated } = await recordAttendance({
        studentId: student._id.toString(),
        classId: id,
        present: false,
      });
      markedAbsent.push({ name: updated.name, leaveCycle: updated.currentLeaveCycle ?? 0 });
    }

    session.endedAt = new Date();
    session.endedBy = auth.userId;
    await session.save();

    return NextResponse.json({
      success: true,
      endedAt: session.endedAt,
      markedAbsentCount: markedAbsent.length,
      markedAbsent,
      // Crossing 2 or 3 raises a notification; surfaced so the UI can tell the
      // admin what this action just triggered rather than leaving it implicit.
      warningsRaised: markedAbsent.filter((m) => m.leaveCycle === 2 || m.leaveCycle === 3).length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Reopens a class ended by mistake. Leaves already recorded are not reversed —
 *  toggle the individual student back to present on the roster to do that, which
 *  decrements their counters correctly. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getAuthPayload(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await params;

    const session = await ClassSession.findByIdAndUpdate(
      id,
      { $unset: { endedAt: 1, endedBy: 1 } },
      { new: true }
    );
    if (!session) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    return NextResponse.json({ success: true, endedAt: null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
