import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { CricketTeam } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';
import { parseTeamInput } from '@/lib/cricket/team-input';

// Cricket administration is club business, not the tuition programme, so it
// sits behind the same admin-only guard as /api/members — an lms_manager token
// is rejected here.

export async function GET(request: Request) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const teams = await CricketTeam.find().sort({ name: 1 }).lean();
    return NextResponse.json({ teams });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const data = await request.json();
    const input = parseTeamInput(data);
    if (typeof input === 'string') return NextResponse.json({ error: input }, { status: 400 });

    const team = await CricketTeam.create({
      ...input,
      players: input.players ?? [],
      logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : undefined,
      logoPublicId: typeof data.logoPublicId === 'string' ? data.logoPublicId : undefined,
    });
    return NextResponse.json({ team }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A team with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
