import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Member } from '@/models';
import { uploadImage, isCloudinaryConfigured, CLOUDINARY_MEMBERS_FOLDER } from '@/lib/cloudinary';

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB, same cap as /api/upload
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Public membership registration — called by the club's landing page's Join form
 * (components/landing/ui/JoinModal.tsx). No auth: anyone visiting the site can
 * apply. Every submission lands as `status: 'pending'` and only an admin (not
 * lms_manager) can act on it from here — see /api/members. next.config.ts already
 * serves /api/* with Access-Control-Allow-Origin: *, so the landing page can call
 * this from any origin.
 *
 * multipart/form-data, not JSON — the form includes a required photo file.
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const form = await request.formData();

    const fullName = String(form.get('fullName') ?? '').trim();
    const phone = String(form.get('phone') ?? '').trim();
    const nic = String(form.get('nic') ?? '').trim();
    const photo = form.get('photo');

    if (!fullName) return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    if (!phone) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    if (!nic) return NextResponse.json({ error: 'NIC number is required' }, { status: 400 });
    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json({ error: 'A photo is required' }, { status: 400 });
    }
    if (!ALLOWED_PHOTO_TYPES.includes(photo.type)) {
      return NextResponse.json({ error: `Unsupported image type: ${photo.type || 'unknown'}` }, { status: 415 });
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: 'Photo is larger than 8MB' }, { status: 413 });
    }
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: 'Photo uploads are not configured yet — contact the club.' }, { status: 503 });
    }

    // A public, unauthenticated endpoint accepting free text is an easy spam vector —
    // capping field lengths here keeps a bad-faith submission from writing an
    // arbitrarily large document, independent of whatever the landing page validates.
    const cap = (v: FormDataEntryValue | null, max: number) =>
      typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;

    const buffer = Buffer.from(await photo.arrayBuffer());
    const uploaded = await uploadImage(buffer, photo.name, CLOUDINARY_MEMBERS_FOLDER);

    const member = await Member.create({
      fullName: fullName.slice(0, 120),
      phone: phone.slice(0, 30),
      nic: nic.slice(0, 30),
      photoUrl: uploaded.url,
      photoPublicId: uploaded.publicId,
      email: cap(form.get('email'), 254),
      dateOfBirth: form.get('dateOfBirth') ? new Date(String(form.get('dateOfBirth'))) : undefined,
      address: cap(form.get('address'), 300),
      guardianName: cap(form.get('guardianName'), 120),
      guardianPhone: cap(form.get('guardianPhone'), 30),
      memberType: cap(form.get('memberType'), 60),
      interest: cap(form.get('interest'), 200),
      message: cap(form.get('message'), 1000),
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
