/**
 * Database-side helpers shared by the cricket routes. The rules themselves are
 * in engine.ts / scoring.ts / view.ts, which never touch mongoose.
 */
import mongoose from 'mongoose';
import { CricketMatch, CricketTeam, CricketTournament } from '@/models';
import { slugify } from '@/lib/slug';
import { matchView, type MatchDoc, type TeamDoc, type TeamMap, type TournamentDoc } from './view';

/**
 * Lean documents still carry ObjectIds and Dates. Round-tripping through JSON
 * turns both into strings, which is the shape the pure cricket modules expect
 * (and compare ids with ===).
 */
export const plain = <T>(doc: unknown): T => JSON.parse(JSON.stringify(doc)) as T;

export const isObjectId = (id: unknown): id is string => typeof id === 'string' && mongoose.isValidObjectId(id);

/**
 * Public cricket reads are polled by every open scoreboard. Letting Vercel's
 * edge hold each response for a few seconds means a thousand spectators cost
 * one function invocation — and one Mongo connection — per interval rather
 * than a thousand, which is the failure the gallery uploads already ran into
 * (see CLAUDE.md). Nothing here is per-viewer, so caching is safe.
 */
export const LIVE_CACHE = { 'Cache-Control': 'public, s-maxage=4, stale-while-revalidate=20' };
export const BROWSE_CACHE = { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=120' };

export async function loadTeams(ids?: string[]): Promise<TeamMap> {
  const query = ids ? { _id: { $in: [...new Set(ids)].filter(isObjectId) } } : {};
  const teams = plain<TeamDoc[]>(await CricketTeam.find(query).lean());
  return new Map(teams.map((t) => [t._id, t]));
}

export async function loadTournaments(filter: Record<string, unknown> = {}) {
  const tournaments = plain<TournamentDoc[]>(await CricketTournament.find(filter).sort({ startDate: -1, createdAt: -1 }).lean());
  return new Map(tournaments.map((t) => [t._id, t]));
}

/**
 * What the public may see: a match that is not hidden, and whose tournament —
 * if it has one — has been published. `publishedTournamentIds` is passed in so
 * a caller that already loaded the tournaments does not query twice.
 */
export function publicMatchFilter(publishedTournamentIds: string[]) {
  return {
    isPublished: { $ne: false },
    $or: [{ tournamentId: null }, { tournamentId: { $in: publishedTournamentIds } }],
  };
}

/** Matches without their deliveries — for lists, where `scores` already has the totals. */
export async function findMatchCards(filter: Record<string, unknown>, sort: Record<string, 1 | -1>, limit = 50) {
  return plain<MatchDoc[]>(
    await CricketMatch.find(filter).select('-innings.balls').sort(sort).limit(limit).lean()
  );
}

export async function findMatches(filter: Record<string, unknown>) {
  return plain<MatchDoc[]>(await CricketMatch.find(filter).sort({ startAt: 1 }).lean());
}

export async function uniqueTournamentSlug(name: string, excludeId?: string) {
  const base = slugify(name) || 'tournament';
  let candidate = base;
  let n = 2;
  while (await CricketTournament.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}

/** A trimmed, length-capped string from a request body — anything else becomes ''. */
export const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/** A date from a form field, or null when it is empty or unparseable. */
export function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseOvers(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 50 ? n : null;
}

/** The scorer's view of a match: the public view plus the fields only staff act on. */
export async function adminMatchView(match: MatchDoc) {
  const [teams, tournament] = await Promise.all([
    loadTeams([match.teamA, match.teamB]),
    match.tournamentId ? CricketTournament.findById(match.tournamentId).lean() : null,
  ]);
  return {
    ...matchView(match, teams, tournament ? plain<TournamentDoc>(tournament) : null),
    rev: match.rev ?? 0,
    isPublished: match.isPublished !== false,
    tournamentId: match.tournamentId ?? null,
  };
}

/**
 * Teams have no publish flag of their own. A team is public once it is in a
 * published tournament or has played a public match — otherwise the squad of a
 * tournament still being set up would be readable by guessing ids.
 */
export async function isTeamPublic(teamId: string, publishedTournamentIds: string[]) {
  const inTournament = await CricketTournament.exists({ _id: { $in: publishedTournamentIds }, teams: teamId });
  if (inTournament) return true;
  return !!(await CricketMatch.exists({
    $and: [publicMatchFilter(publishedTournamentIds), { $or: [{ teamA: teamId }, { teamB: teamId }] }],
  }));
}
