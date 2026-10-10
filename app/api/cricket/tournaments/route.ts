import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { CricketTournament } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';
import { isObjectId, parseDate, parseOvers, text, uniqueTournamentSlug } from '@/lib/cricket/server';

export async function GET(request: Request) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const tournaments = await CricketTournament.find().sort({ startDate: -1, createdAt: -1 }).lean();
    return NextResponse.json({ tournaments });
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

    const name = text(data.name, 80);
    if (!name) return NextResponse.json({ error: 'Tournament name is required' }, { status: 400 });
    const overs = parseOvers(data.oversPerInnings ?? 20);
    if (!overs) return NextResponse.json({ error: 'Overs per innings must be a whole number from 1 to 50' }, { status: 400 });

    // Omitted points fall back to the schema defaults (2 / 1 / 1).
    const pointFields: Record<string, number> = {};
    for (const field of ['pointsWin', 'pointsTie', 'pointsNoResult']) {
      if (data[field] === undefined) continue;
      const n = Number(data[field]);
      if (!Number.isInteger(n) || n < 0 || n > 10) {
        return NextResponse.json({ error: 'Points must be whole numbers from 0 to 10' }, { status: 400 });
      }
      pointFields[field] = n;
    }

    const tournament = await CricketTournament.create({
      ...pointFields,
      name,
      slug: await uniqueTournamentSlug(name),
      season: text(data.season, 20) || undefined,
      venue: text(data.venue, 80) || undefined,
      oversPerInnings: overs,
      teams: Array.isArray(data.teams) ? data.teams.filter(isObjectId) : [],
      startDate: parseDate(data.startDate) ?? undefined,
      endDate: parseDate(data.endDate) ?? undefined,
    });
    return NextResponse.json({ tournament }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
