import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { matchCard, teamBrief } from '@/lib/cricket/view';
import {
  BROWSE_CACHE,
  findMatchCards,
  isObjectId,
  isTeamPublic,
  loadTeams,
  loadTournaments,
  publicMatchFilter,
} from '@/lib/cricket/server';

/**
 * A team's squad and its public matches — no auth.
 *
 * GET /api/public/cricket/teams/[id]
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!isObjectId(id)) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    await connectToDatabase();

    const tournaments = await loadTournaments({ isPublished: true });
    const published = [...tournaments.keys()];
    if (!(await isTeamPublic(id, published))) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    const matches = await findMatchCards(
      { $and: [publicMatchFilter(published), { $or: [{ teamA: id }, { teamB: id }] }] },
      { startAt: -1 },
      60
    );
    const teams = await loadTeams([id, ...matches.flatMap((m) => [m.teamA, m.teamB])]);
    const team = teams.get(id);
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    return NextResponse.json(
      {
        team: teamBrief(teams, id),
        players: team.players.map((p) => ({
          id: p._id,
          name: p.name,
          role: p.role ?? 'batter',
          isCaptain: !!p.isCaptain,
          isKeeper: !!p.isKeeper,
        })),
        matches: matches.map((m) => matchCard(m, teams, m.tournamentId ? tournaments.get(m.tournamentId) : null)),
        tournaments: [...tournaments.values()]
          .filter((t) => t.teams.includes(id))
          .map((t) => ({ name: t.name, slug: t.slug, season: t.season || null })),
      },
      { headers: BROWSE_CACHE }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
