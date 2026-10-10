import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { CricketMatch, CricketTournament } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';
import { TOURNAMENT_STATUSES } from '@/lib/cricket/engine';
import { isObjectId, parseDate, parseOvers, text } from '@/lib/cricket/server';

const points = (value: unknown) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 10 ? n : null;
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    const data = await request.json();
    const update: Record<string, unknown> = {};

    // The slug is deliberately not regenerated on rename: it is the public URL,
    // and a link shared on match day must keep working.
    if (data.name !== undefined) {
      const name = text(data.name, 80);
      if (!name) return NextResponse.json({ error: 'Tournament name is required' }, { status: 400 });
      update.name = name;
    }
    if (data.season !== undefined) update.season = text(data.season, 20);
    if (data.venue !== undefined) update.venue = text(data.venue, 80);
    if (data.oversPerInnings !== undefined) {
      const overs = parseOvers(data.oversPerInnings);
      if (!overs) return NextResponse.json({ error: 'Overs per innings must be a whole number from 1 to 50' }, { status: 400 });
      update.oversPerInnings = overs;
    }
    if (data.teams !== undefined) {
      if (!Array.isArray(data.teams)) return NextResponse.json({ error: 'teams must be a list' }, { status: 400 });
      update.teams = [...new Set(data.teams.filter(isObjectId))];
    }
    if (data.status !== undefined) {
      if (!TOURNAMENT_STATUSES.includes(data.status)) {
        return NextResponse.json({ error: `status must be one of: ${TOURNAMENT_STATUSES.join(', ')}` }, { status: 400 });
      }
      update.status = data.status;
    }
    for (const field of ['pointsWin', 'pointsTie', 'pointsNoResult'] as const) {
      if (data[field] === undefined) continue;
      const value = points(data[field]);
      if (value === null) return NextResponse.json({ error: 'Points must be whole numbers from 0 to 10' }, { status: 400 });
      update[field] = value;
    }
    if (data.startDate !== undefined) update.startDate = parseDate(data.startDate);
    if (data.endDate !== undefined) update.endDate = parseDate(data.endDate);
    if (data.isPublished !== undefined) update.isPublished = !!data.isPublished;

    const tournament = await CricketTournament.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    return NextResponse.json({ tournament });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    // Deleting a tournament must not silently turn its matches into public
    // friendlies (an unpublished tournament's matches are hidden; a match with
    // no tournament is not), so it is refused while any are attached.
    const matchCount = await CricketMatch.countDocuments({ tournamentId: id });
    if (matchCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: this tournament has ${matchCount} match(es). Delete those matches first.` },
        { status: 409 }
      );
    }
    const tournament = await CricketTournament.findByIdAndDelete(id);
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
