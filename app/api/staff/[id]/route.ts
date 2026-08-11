import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User, USER_ROLES } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';
import { hashPassword } from '@/lib/auth';

// A document missing `isActive` entirely (created before that field existed) hydrates
// as `true` via the Mongoose schema default when read through `findById`/`find`, but a
// raw filter like `{ isActive: true }` does NOT retroactively match it — Mongoose only
// applies defaults at document construction/hydration, never to query filters. Every
// count here has to account for that explicitly or it undercounts real active admins.
const ACTIVE = { $or: [{ isActive: true }, { isActive: { $exists: false } }] };

/** True if removing/demoting/deactivating this user would leave zero active admins. */
async function wouldOrphanAdmins(userId: string, becomingNonAdmin: boolean): Promise<boolean> {
  const target = await User.findById(userId);
  if (!target || target.role !== 'admin' || !target.isActive || !becomingNonAdmin) return false;
  const activeAdmins = await User.countDocuments({ role: 'admin', ...ACTIVE });
  return activeAdmins <= 1;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    const data = await request.json();

    const existing = await User.findById(id);
    if (!existing) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });

    const update: Record<string, unknown> = {};

    if (data.role !== undefined) {
      if (!USER_ROLES.includes(data.role)) {
        return NextResponse.json({ error: `Role must be one of: ${USER_ROLES.join(', ')}` }, { status: 400 });
      }
      update.role = data.role;
    }
    if (data.isActive !== undefined) update.isActive = Boolean(data.isActive);
    if (data.password) {
      if (data.password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }
      update.passwordHash = await hashPassword(data.password);
    }

    // The system must always have at least one active admin, or nobody can ever
    // review a membership application (or create another admin) again.
    const becomingNonAdmin =
      (update.role !== undefined && update.role !== 'admin') || update.isActive === false;
    if (await wouldOrphanAdmins(id, becomingNonAdmin)) {
      return NextResponse.json(
        { error: 'Cannot demote/deactivate the last active admin account' },
        { status: 409 }
      );
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .select('email role isActive createdAt');
    return NextResponse.json({ user });
  } catch (error: any) {
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

    if (await wouldOrphanAdmins(id, true)) {
      return NextResponse.json({ error: 'Cannot delete the last active admin account' }, { status: 409 });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
