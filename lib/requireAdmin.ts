import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

/**
 * Guard for routes that must not be open to the internet.
 *
 * Note the asymmetry with the rest of this API: the student/attendance/marks routes
 * are not token-checked (see CLAUDE.md). These news routes are, because they write
 * content that renders on the club's public website and next.config.ts serves
 * /api/* with Access-Control-Allow-Origin: *. Unauthenticated writes here would let
 * anyone publish to the club site.
 *
 * Accepts either auth method the login route issues: the httpOnly cookie (web admin)
 * or the Authorization: Bearer header (mobile app).
 */
export async function isAdminRequest(request: Request): Promise<boolean> {
  const bearer = request.headers.get('authorization');
  if (bearer?.startsWith('Bearer ')) {
    if (verifyToken(bearer.slice(7))) return true;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (token && verifyToken(token)) return true;

  return false;
}
