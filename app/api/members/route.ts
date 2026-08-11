import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Member, MEMBER_STATUSES } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';

/**
 * Admin-only. An lms_manager token is valid but still gets 401 here — that boundary
 * is the entire point of the second role. See lib/auth-guard.ts.
 */
export async function GET(request: Request) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query = status && MEMBER_STATUSES.includes(status as any) ? { status } : {};

    const members = await Member.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Manual entry for a walk-in signup — defaults to 'approved' since the admin is present. */
export async function POST(request: Request) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const data = await request.json();
    if (!data.fullName?.trim()) return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    if (!data.phone?.trim()) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });

    const member = await Member.create({ ...data, status: data.status ?? 'approved' });
    return NextResponse.json({ member }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
