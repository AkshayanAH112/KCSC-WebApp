import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { CricketMatch, CricketTeam, CricketTournament } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';
import { deleteImage } from '@/lib/spaces';
import { parseTeamInput } from '@/lib/cricket/team-input';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    const data = await request.json();
    const input = parseTeamInput(data);
    if (typeof input === 'string') return NextResponse.json({ error: input }, { status: 400 });

    const team = await CricketTeam.findById(id);
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    if (input.players) {
      // Every ball ever scored names its batters and bowler by player id. Dropping
      // a player who has appeared in a match would leave those balls pointing at
      // nobody, so a player in any match squad can be renamed but not removed.
      const keeping = new Set(input.players.map((p) => p._id).filter(Boolean));
      const removed = team.players.filter((p: any) => !keeping.has(String(p._id)));
      if (removed.length > 0) {
        const removedIds = removed.map((p: any) => p._id);
        const inUse = await CricketMatch.find({
          $or: [{ squadA: { $in: removedIds } }, { squadB: { $in: removedIds } }],
        }).select('squadA squadB').lean();
        if (inUse.length > 0) {
          const used = new Set(inUse.flatMap((m: any) => [...m.squadA, ...m.squadB].map(String)));
          const names = removed.filter((p: any) => used.has(String(p._id))).map((p: any) => p.name);
          return NextResponse.json(
            { error: `Cannot remove ${names.join(', ')} — already named in a match squad. Rename instead, or delete those matches first.` },
            { status: 409 }
          );
        }
      }
      team.players = input.players;
    }

    team.name = input.name;
    team.shortName = input.shortName;
    team.color = input.color;

    // Replacing or clearing the crest removes the old object from Spaces too —
    // best-effort, so a storage failure never blocks the save.
    if (data.logoUrl !== undefined && data.logoUrl !== team.logoUrl) {
      const oldPublicId = team.logoPublicId;
      team.logoUrl = data.logoUrl || undefined;
      team.logoPublicId = data.logoPublicId || undefined;
      if (oldPublicId) await deleteImage(oldPublicId).catch(() => {});
    }

    await team.save();
    return NextResponse.json({ team });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'A team with this name already exists' }, { status: 400 });
    }
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

    const matchCount = await CricketMatch.countDocuments({ $or: [{ teamA: id }, { teamB: id }] });
    if (matchCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: this team has ${matchCount} match(es). Delete those matches first.` },
        { status: 409 }
      );
    }

    const team = await CricketTeam.findByIdAndDelete(id);
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    await CricketTournament.updateMany({ teams: id }, { $pull: { teams: id } });
    if (team.logoPublicId) await deleteImage(team.logoPublicId).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
