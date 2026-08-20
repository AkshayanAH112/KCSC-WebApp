import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Notification, NOTIFICATION_STATUSES } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    const data = await request.json();

    if (data.status !== undefined && !NOTIFICATION_STATUSES.includes(data.status)) {
      return NextResponse.json({ error: `status must be one of: ${NOTIFICATION_STATUSES.join(', ')}` }, { status: 400 });
    }

    const notification = await Notification.findByIdAndUpdate(id, { status: data.status }, { new: true, runValidators: true });
    if (!notification) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    return NextResponse.json({ notification });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
