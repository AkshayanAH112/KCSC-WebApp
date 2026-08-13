import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Member } from '@/models';
import { uploadImage, isCloudinaryConfigured } from '@/lib/cloudinary';

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

    let imageUrl = undefined;
    if (typeof data.image === 'string' && data.image.startsWith('data:image/') && isCloudinaryConfigured()) {
      try {
        const base64Data = data.image.split(';base64,').pop() || '';
        const buffer = Buffer.from(base64Data, 'base64');
        const uploaded = await uploadImage(buffer, `member_${Date.now()}`);
        imageUrl = uploaded.url;
      } catch (e) {
        console.error('Failed to upload profile image to Cloudinary', e);
        // If it fails, fallback to saving base64 to avoid losing the image
        imageUrl = data.image;
      }
    } else if (typeof data.image === 'string') {
      imageUrl = data.image;
    }

    const member = await Member.create({
      fullName: fullName.slice(0, 120),
      phone: phone.slice(0, 30),
      email: cap(data.email, 254),
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      nic: cap(data.nic, 20),
      age: typeof data.age === 'number' ? data.age : (data.age ? parseInt(data.age, 10) : undefined),
      image: imageUrl,
      gender: cap(data.gender, 20),
      whatsapp: cap(data.whatsapp, 30),
      dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : undefined,
      previousClub: cap(data.previousClub, 120),
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
