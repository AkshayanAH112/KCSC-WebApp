import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { matchCard } from '@/lib/cricket/view';
import { LIVE_CACHE, findMatchCards, loadTeams, loadTournaments, publicMatchFilter } from '@/lib/cricket/server';

/**
 * Live-scores home — no auth. Backs /live on the marketing site: what is being
 * played now, what is next, the latest results, and the published tournaments.
 * Reads the denormalised `scores` only; no deliveries are loaded here.
 *
 * GET /api/public/cricket
 */
export async function GET() {
  try {
    await connectToDatabase();
    const tournaments = await loadTournaments({ isPublished: true });
    const visible = publicMatchFilter([...tournaments.keys()]);

    const [live, upcoming, results, teams] = await Promise.all([
      findMatchCards({ ...visible, status: { $in: ['live', 'innings_break'] } }, { startAt: 1 }, 20),
      findMatchCards({ ...visible, status: 'upcoming' }, { startAt: 1 }, 12),
      findMatchCards({ ...visible, status: { $in: ['completed', 'abandoned'] } }, { startAt: -1, updatedAt: -1 }, 12),
      loadTeams(),
    ]);
    const card = (m: (typeof live)[number]) => matchCard(m, teams, m.tournamentId ? tournaments.get(m.tournamentId) : null);

    return NextResponse.json(
      {
        live: live.map(card),
        upcoming: upcoming.map(card),
        results: results.map(card),
        tournaments: [...tournaments.values()].map((t) => ({
          name: t.name,
          slug: t.slug,
          season: t.season || null,
          status: t.status,
          teamCount: t.teams.length,
        })),
      },
      { headers: LIVE_CACHE }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
