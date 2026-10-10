/**
 * Names for the <title> of the public cricket pages. Each lookup applies the
 * same visibility rule as the matching /api/public/cricket route and returns
 * null for anything not public — a hidden match must not leak its teams through
 * a page title or a link preview either.
 *
 * Wrapped in React's cache(): a page asks for the same name twice per request
 * (generateMetadata, then the breadcrumb), and this makes that one lookup.
 */
import { cache } from 'react';
import connectToDatabase from '@/lib/mongodb';
import { CricketMatch, CricketTeam, CricketTournament } from '@/models';
import { isObjectId, isTeamPublic, loadTeams, plain } from './server';
import type { MatchDoc, TeamDoc } from './view';

async function publishedTournamentIds() {
  const rows = await CricketTournament.find({ isPublished: true }).select('_id').lean();
  return rows.map((r: { _id: unknown }) => String(r._id));
}

export const matchTitle = cache(async (id: string): Promise<string | null> => {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await CricketMatch.findOne({ _id: id, isPublished: { $ne: false } }).select('teamA teamB tournamentId').lean();
  if (!doc) return null;
  const match = plain<MatchDoc>(doc);
  if (match.tournamentId && !(await CricketTournament.exists({ _id: match.tournamentId, isPublished: true }))) return null;
  const teams = await loadTeams([match.teamA, match.teamB]);
  const a = teams.get(match.teamA)?.name;
  const b = teams.get(match.teamB)?.name;
  return a && b ? `${a} v ${b}` : null;
});

export const tournamentTitle = cache(async (slug: string): Promise<string | null> => {
  await connectToDatabase();
  const doc = await CricketTournament.findOne({ slug, isPublished: true }).select('name season').lean<{ name: string; season?: string }>();
  return doc ? [doc.name, doc.season].filter(Boolean).join(' ') : null;
});

export const teamTitle = cache(async (id: string): Promise<string | null> => {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  if (!(await isTeamPublic(id, await publishedTournamentIds()))) return null;
  const doc = await CricketTeam.findById(id).select('name').lean<{ name: string }>();
  return doc?.name ?? null;
});

export const playerTitle = cache(async (id: string): Promise<string | null> => {
  if (!isObjectId(id)) return null;
  await connectToDatabase();
  const doc = await CricketTeam.findOne({ 'players._id': id }).select('name players').lean();
  if (!doc) return null;
  const team = plain<TeamDoc>(doc);
  if (!(await isTeamPublic(team._id, await publishedTournamentIds()))) return null;
  const player = team.players.find((p) => p._id === id);
  return player ? `${player.name} (${team.name})` : null;
});
