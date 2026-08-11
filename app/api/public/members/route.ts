import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Member } from '@/models';

/**
 * Public membership registration — called by the club's landing page (a separate
 * project). No auth: anyone visiting the site can apply. Every submission lands as
 * `status: 'pending'` and only an admin (not lms_manager) can act on it from here —
 * see /api/members. next.config.ts already serves /api/* with
 * Access-Control-Allow-Origin: *, so the landing page can call this from any origin.
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();

    const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : '';
    const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
    if (!fullName) return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    if (!phone) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });

    // A public, unauthenticated endpoint accepting free text is an easy spam vector —
    // capping field lengths here keeps a bad-faith submission from writing an
    // arbitrarily large document, independent of whatever the landing page validates.
    const cap = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);

    const member = await Member.create({
      fullName: fullName.slice(0, 120),
      phone: phone.slice(0, 30),
      email: cap(data.email, 254),
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      address: cap(data.address, 300),
      guardianName: cap(data.guardianName, 120),
      guardianPhone: cap(data.guardianPhone, 30),
      interest: cap(data.interest, 200),
      message: cap(data.message, 1000),
      status: 'pending',
    });

    return NextResponse.json(
      { success: true, id: member._id, message: 'Application received — the club will be in touch.' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
