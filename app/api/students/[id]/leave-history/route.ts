import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Attendance } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

/**
 * Permanent leave ledger for one student — a projection over Attendance, not
 * a separate collection (see models/index.ts comment on Attendance.countedAsLeave
 * for why: a parallel collection would have to be kept in lockstep with this
 * flag on every toggle, duplicating the exact transition logic twice).
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const leaves = await Attendance.find({ studentId: id, countedAsLeave: true })
      .populate('classId')
      .sort({ date: 1 });

    return NextResponse.json({ leaves });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
