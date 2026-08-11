import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

/**
 * Auth guards for routes that must not be open to the internet.
 *
 * Note the asymmetry with the rest of this API: the student/batch/class/attendance/
 * marks/dashboard routes now require `isStaffRequest` (any logged-in role), but plenty
 * of the original build was unauthenticated by design — see CLAUDE.md. Anything new
 * should be guarded explicitly; nothing here is automatic.
 *
 * Both auth methods the login route issues are accepted: the httpOnly cookie (web
 * admin) or the Authorization: Bearer header (mobile app).
 */

export type AuthPayload = { userId: string; role: 'admin' | 'lms_manager' };

async function getBearerToken(request: Request): Promise<string | null> {
  const bearer = request.headers.get('authorization');
  if (bearer?.startsWith('Bearer ')) return bearer.slice(7);
  return null;
}

async function getCookieToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value ?? null;
}

/** Decodes and verifies the caller's token, from either auth method. Null if absent/invalid. */
export async function getAuthPayload(request: Request): Promise<AuthPayload | null> {
  const bearerToken = await getBearerToken(request);
  if (bearerToken) {
    const payload = verifyToken(bearerToken);
    if (payload && typeof payload === 'object' && 'userId' in payload) {
      return payload as AuthPayload;
    }
  }

  const cookieToken = await getCookieToken();
  if (cookieToken) {
    const payload = verifyToken(cookieToken);
    if (payload && typeof payload === 'object' && 'userId' in payload) {
      return payload as AuthPayload;
    }
  }

  return null;
}

/** Any authenticated staff member — admin or lms_manager. Used by the LMS and news routes. */
export async function isStaffRequest(request: Request): Promise<boolean> {
  return (await getAuthPayload(request)) !== null;
}

/**
 * Full admin only. Used exclusively by /api/members* and /api/staff* — an lms_manager
 * token fails this check even though it's otherwise valid, which is the entire point
 * of the second role: it can operate the LMS but has no path to club membership data.
 */
export async function isAdminOnlyRequest(request: Request): Promise<boolean> {
  const payload = await getAuthPayload(request);
  return payload?.role === 'admin';
}
