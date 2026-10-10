import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { CricketTeam } from '@/models';
import { aggregatePlayers, teamBrief, type TeamDoc } from '@/lib/cricket/view';
import {
  BROWSE_CACHE,
  findMatches,
  isObjectId,
  isTeamPublic,
  loadTeams,
  loadTournaments,
  plain,
  publicMatchFilter,
} from '@/lib/cricket/server';

/**
 * One player's career figures and match-by-match record — no auth. Counted over
 * public matches only, so a practice game kept off the site does not move
 * anyone's average either.
 *
 * GET /api/public/cricket/players/[id]
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!isObjectId(id)) return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    await connectToDatabase();

    const doc = await CricketTeam.findOne({ 'players._id': id }).lean();
    if (!doc) return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    const team = plain<TeamDoc>(doc);
    const player = team.players.find((p) => p._id === id);
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    const tournaments = await loadTournaments({ isPublished: true });
    const published = [...tournaments.keys()];
    if (!(await isTeamPublic(team._id, published))) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const matches = await findMatches({
      $and: [publicMatchFilter(published), { $or: [{ squadA: id }, { squadB: id }] }],
    });
    const { totals, log } = aggregatePlayers(matches, id);
    const teams = await loadTeams([team._id, ...log.map((l) => l.opponent)]);

    return NextResponse.json(
      {
        player: {
          id,
          name: player.name,
          role: player.role ?? 'batter',
          isCaptain: !!player.isCaptain,
          isKeeper: !!player.isKeeper,
        },
        team: teamBrief(teams, team._id),
        totals: totals.get(id) ?? null,
        // Newest first: the page leads with recent form.
        log: log.reverse().map((l) => ({ ...l, opponent: teamBrief(teams, l.opponent) })),
      },
      { headers: BROWSE_CACHE }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
