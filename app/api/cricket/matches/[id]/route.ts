import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { CricketMatch, CricketTeam, CricketTournament } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';
import type { MatchDoc } from '@/lib/cricket/view';
import { adminMatchView, isObjectId, parseDate, parseOvers, plain, text } from '@/lib/cricket/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    if (!isObjectId(id)) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    const doc = await CricketMatch.findById(id).lean();
    if (!doc) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    return NextResponse.json({ match: await adminMatchView(plain<MatchDoc>(doc)) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Match details — everything except the deliveries, which only ever change
 * through POST /api/cricket/matches/[id]/score.
 */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    if (!isObjectId(id)) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    const data = await request.json();

    // Read without the deliveries, and written back with a targeted $set rather
    // than save(): this route must never be able to rewrite `innings`, which a
    // scorer may be appending to at the same moment.
    const match = await CricketMatch.findById(id).select('-innings.balls').lean<any>();
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    const started = match.innings.length > 0;
    const set: Record<string, unknown> = {};
    const unset: Record<string, ''> = {};

    if (data.title !== undefined) set.title = text(data.title, 60);
    if (data.venue !== undefined) set.venue = text(data.venue, 80);
    if (data.isPublished !== undefined) set.isPublished = !!data.isPublished;
    if (data.startAt !== undefined) {
      const startAt = parseDate(data.startAt);
      if (startAt) set.startAt = startAt;
      else unset.startAt = '';
    }

    if (data.tournamentId !== undefined) {
      if (!data.tournamentId) {
        unset.tournamentId = '';
      } else {
        if (!isObjectId(data.tournamentId) || !(await CricketTournament.exists({ _id: data.tournamentId }))) {
          return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }
        set.tournamentId = data.tournamentId;
      }
    }

    // Overs and the playing sides fix an innings' limits (balls available,
    // wickets to fall). Changing either under a match already in progress would
    // retroactively move those limits, so both lock at the first innings.
    if (data.oversPerInnings !== undefined) {
      if (started) return NextResponse.json({ error: 'Overs cannot change once the match has started' }, { status: 409 });
      const overs = parseOvers(data.oversPerInnings);
      if (!overs) return NextResponse.json({ error: 'Overs per innings must be a whole number from 1 to 50' }, { status: 400 });
      set.oversPerInnings = overs;
    }

    const squads: Record<'squadA' | 'squadB', string[]> = {
      squadA: match.squadA.map(String),
      squadB: match.squadB.map(String),
    };
    for (const [field, teamId] of [['squadA', match.teamA], ['squadB', match.teamB]] as const) {
      if (data[field] === undefined) continue;
      if (started) return NextResponse.json({ error: 'Squads cannot change once the match has started' }, { status: 409 });
      if (!Array.isArray(data[field])) return NextResponse.json({ error: `${field} must be a list` }, { status: 400 });
      const team = await CricketTeam.findById(teamId).select('players._id').lean<{ players: { _id: unknown }[] }>();
      const roster = new Set((team?.players ?? []).map((p) => String(p._id)));
      const squad = [...new Set<string>(data[field].filter(isObjectId))];
      if (squad.some((p) => !roster.has(p))) {
        return NextResponse.json({ error: 'A selected player is not on that team' }, { status: 400 });
      }
      squads[field] = squad;
      set[field] = squad;
    }

    if (data.playerOfMatch !== undefined) {
      if (!data.playerOfMatch) {
        unset.playerOfMatch = '';
      } else {
        if (![...squads.squadA, ...squads.squadB].includes(data.playerOfMatch)) {
          return NextResponse.json({ error: 'That player did not play in this match' }, { status: 400 });
        }
        set.playerOfMatch = data.playerOfMatch;
      }
    }

    await CricketMatch.updateOne(
      { _id: id },
      { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) }
    );
    const fresh = await CricketMatch.findById(id).lean();
    return NextResponse.json({ match: await adminMatchView(plain<MatchDoc>(fresh)) });
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
    if (!isObjectId(id)) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    const match = await CricketMatch.findByIdAndDelete(id);
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
