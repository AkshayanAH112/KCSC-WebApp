import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { CricketMatch } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';
import { applyAction, scoreLines, ScoringError } from '@/lib/cricket/scoring';
import type { MatchDoc } from '@/lib/cricket/view';
import { adminMatchView, isObjectId, plain } from '@/lib/cricket/server';

/**
 * The only way a delivery is ever written. Every scorer button — a ball, a
 * wicket, undo, new batter, end of innings — posts one action here:
 *
 *   POST /api/cricket/matches/[id]/score   { rev, action: { type: 'ball', runs: 4 } }
 *
 * The rules live in lib/cricket/scoring.ts; this route loads the match, applies
 * the action to it in memory, and writes the result back.
 *
 * `rev` is what makes that safe. The client sends the revision it last saw and
 * the write is conditional on the stored revision still matching, so a
 * double-tap, a retried request on a bad ground-side connection, or a second
 * phone scoring the same match cannot record one ball twice — the loser gets a
 * 409 with the current scoreboard instead of silently adding to it. (A plain
 * load-mutate-save here is the same lost-update trap the gallery upload route
 * fell into under parallel requests.)
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    if (!isObjectId(id)) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

    const body = await request.json();
    if (typeof body?.rev !== 'number' || !body.action || typeof body.action.type !== 'string') {
      return NextResponse.json({ error: 'rev and action are required' }, { status: 400 });
    }

    const doc = await CricketMatch.findById(id).lean();
    if (!doc) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    const match = plain<MatchDoc>(doc);
    const rev = match.rev ?? 0;

    const stale = async () =>
      NextResponse.json(
        {
          error: 'The scoreboard changed on another device. It has been refreshed — check the last ball before continuing.',
          match: await adminMatchView(plain<MatchDoc>(await CricketMatch.findById(id).lean())),
        },
        { status: 409 }
      );
    if (body.rev !== rev) return stale();

    let next;
    try {
      next = applyAction(match, body.action);
    } catch (e) {
      if (e instanceof ScoringError) return NextResponse.json({ error: e.message }, { status: 400 });
      throw e;
    }

    const written = await CricketMatch.updateOne(
      { _id: id, rev },
      {
        $set: {
          innings: next.innings,
          status: next.status,
          toss: next.toss ?? null,
          result: next.result ?? null,
          scores: scoreLines(next),
          rev: rev + 1,
        },
      }
    );
    if (written.matchedCount === 0) return stale();

    return NextResponse.json({ match: await adminMatchView({ ...match, ...next, rev: rev + 1, updatedAt: new Date().toISOString() }) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
