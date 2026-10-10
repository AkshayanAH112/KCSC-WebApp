import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { CricketMatch, CricketTeam, CricketTournament } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';
import { matchCard } from '@/lib/cricket/view';
import { findMatchCards, isObjectId, loadTeams, loadTournaments, parseDate, parseOvers, text } from '@/lib/cricket/server';

export async function GET(request: Request) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const [matches, teams, tournaments] = await Promise.all([
      findMatchCards({}, { startAt: -1, createdAt: -1 }, 200),
      loadTeams(),
      loadTournaments(),
    ]);
    return NextResponse.json({
      matches: matches.map((m) => ({
        ...matchCard(m, teams, m.tournamentId ? tournaments.get(m.tournamentId) : null),
        isPublished: m.isPublished !== false,
      })),
    });
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

    if (!isObjectId(data.teamA) || !isObjectId(data.teamB)) {
      return NextResponse.json({ error: 'Choose both teams' }, { status: 400 });
    }
    if (data.teamA === data.teamB) {
      return NextResponse.json({ error: 'A team cannot play itself' }, { status: 400 });
    }
    const [teamA, teamB] = await Promise.all([CricketTeam.findById(data.teamA), CricketTeam.findById(data.teamB)]);
    if (!teamA || !teamB) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    let tournament = null;
    if (data.tournamentId) {
      if (!isObjectId(data.tournamentId)) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
      tournament = await CricketTournament.findById(data.tournamentId);
      if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // A tournament match defaults to the tournament's format.
    const overs = parseOvers(data.oversPerInnings ?? tournament?.oversPerInnings ?? 20);
    if (!overs) return NextResponse.json({ error: 'Overs per innings must be a whole number from 1 to 50' }, { status: 400 });

    const match = await CricketMatch.create({
      tournamentId: tournament?._id,
      title: text(data.title, 60) || undefined,
      teamA: teamA._id,
      teamB: teamB._id,
      // Everyone on the team sheet to begin with; the scorer trims each side to
      // the playing XI on the match page before the toss.
      squadA: teamA.players.map((p: any) => p._id),
      squadB: teamB.players.map((p: any) => p._id),
      oversPerInnings: overs,
      venue: text(data.venue, 80) || tournament?.venue || undefined,
      startAt: parseDate(data.startAt) ?? undefined,
      isPublished: data.isPublished !== false,
    });
    return NextResponse.json({ match: { id: String(match._id) } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
