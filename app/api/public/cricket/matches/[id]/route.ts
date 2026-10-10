import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { CricketMatch, CricketTournament } from '@/models';
import { matchView, type MatchDoc, type TournamentDoc } from '@/lib/cricket/view';
import { BROWSE_CACHE, LIVE_CACHE, isObjectId, loadTeams, plain } from '@/lib/cricket/server';

/**
 * One match, ball by ball — no auth. The public scoreboard polls this.
 *
 * A hidden match, or one in a tournament that has not been published, answers
 * 404 rather than 403: the id of a practice match should not confirm it exists.
 *
 * GET /api/public/cricket/matches/[id]
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!isObjectId(id)) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    await connectToDatabase();

    const doc = await CricketMatch.findOne({ _id: id, isPublished: { $ne: false } }).lean();
    if (!doc) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    const match = plain<MatchDoc>(doc);

    let tournament: TournamentDoc | null = null;
    if (match.tournamentId) {
      const t = await CricketTournament.findOne({ _id: match.tournamentId, isPublished: true }).lean();
      if (!t) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      tournament = plain<TournamentDoc>(t);
    }

    const teams = await loadTeams([match.teamA, match.teamB]);
    const finished = match.status === 'completed' || match.status === 'abandoned';
    return NextResponse.json(
      { match: matchView(match, teams, tournament) },
      { headers: finished ? BROWSE_CACHE : LIVE_CACHE }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
