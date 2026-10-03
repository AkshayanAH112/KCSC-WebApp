import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Notification } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const leaveCount = searchParams.get('leaveCount');

    const query: Record<string, unknown> = {};
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;
    if (leaveCount) query.leaveCount = Number(leaveCount);

    // Populating is opt-in: the shipped mobile app builds links from
    // `studentId` as a plain string, so the default shape must stay unchanged.
    let findQuery = Notification.find(query).sort({ createdAt: -1 });
    if (searchParams.get('expand') === 'student') {
      findQuery = findQuery.populate({
        path: 'studentId',
        select: 'name registrationNumber guardianName guardianPhone grade batchId school address',
        populate: { path: 'batchId', select: 'name' },
      });
    }
    const notifications = await findQuery;
    return NextResponse.json({ notifications });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
