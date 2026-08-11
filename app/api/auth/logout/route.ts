import { NextResponse } from 'next/server';

/**
 * The auth cookie is httpOnly, so the client cannot clear it itself —
 * the sidebar's logout button needs this route to expire it server-side.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'auth_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
