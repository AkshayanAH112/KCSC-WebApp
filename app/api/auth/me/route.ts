import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { getAuthPayload } from '@/lib/auth-guard';

/**
 * Who-am-I for the currently authenticated session. The web sidebar calls this on
 * mount to decide whether to render the Members section — the httpOnly cookie means
 * client JS can't just decode the JWT itself. Re-reads the user row (not just the
 * JWT payload) so a role change or deactivation takes effect immediately, not after
 * the token's 1-day expiry.
 */
export async function GET(request: Request) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(auth.userId).select('email role isActive');
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ user: { email: user.email, role: user.role } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
