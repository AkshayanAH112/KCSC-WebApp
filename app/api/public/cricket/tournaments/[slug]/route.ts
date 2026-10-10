import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { CricketTournament } from '@/models';
import {
  MVP_POINTS,
  aggregatePlayers,
  matchCard,
  pointsTable,
  teamBrief,
  type TournamentDoc,
} from '@/lib/cricket/view';
import { LIVE_CACHE, findMatches, loadTeams, plain } from '@/lib/cricket/server';

/**
 * A published tournament — no auth: fixtures and results, the points table, and
 * the player statistics behind the leaderboards. Everything is recomputed from
 * the deliveries on each (edge-cached) request, so the table moves the moment a
 * match ends without anyone pressing "update standings".
 *
 * GET /api/public/cricket/tournaments/[slug]
 */
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    await connectToDatabase();

    const doc = await CricketTournament.findOne({ slug, isPublished: true }).lean();
    if (!doc) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    const tournament = plain<TournamentDoc>(doc);

    const matches = await findMatches({ tournamentId: tournament._id, isPublished: { $ne: false } });
    const teams = await loadTeams([...tournament.teams, ...matches.flatMap((m) => [m.teamA, m.teamB])]);
    const { totals } = aggregatePlayers(matches);

    // Names for the players who appear in the statistics, and nobody else.
    const players: Record<string, { name: string; team: string }> = {};
    for (const team of teams.values()) {
      for (const p of team.players) {
        if (totals.has(p._id)) players[p._id] = { name: p.name, team: team._id };
      }
    }

    return NextResponse.json(
      {
        tournament: {
          name: tournament.name,
          slug: tournament.slug,
          season: tournament.season || null,
          venue: tournament.venue || null,
          status: tournament.status,
          oversPerInnings: tournament.oversPerInnings ?? null,
          startDate: tournament.startDate || null,
          endDate: tournament.endDate || null,
          points: { win: tournament.pointsWin, tie: tournament.pointsTie, noResult: tournament.pointsNoResult },
        },
        teams: tournament.teams.map((id) => teamBrief(teams, id)),
        matches: matches.map((m) => matchCard(m, teams, tournament)),
        table: pointsTable(tournament, matches),
        stats: { players, totals: [...totals.values()].filter((t) => players[t.id]), mvpPoints: MVP_POINTS },
      },
      { headers: LIVE_CACHE }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
