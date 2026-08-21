import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Member } from '@/models';
import { uploadImage, isSpacesConfigured, SPACES_MEMBERS_FOLDER, SPACES_PAYMENTS_FOLDER } from '@/lib/spaces';
import { isValidPhone, isPastDate } from '@/lib/validation';
import { isJobCategory, jobFee, jobLabel, isNicRequired } from '@/lib/membership';
import { findDuplicateMemberError } from '@/lib/member-duplicate-check';

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB, same cap as /api/upload
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
// Slips are photos of a bank receipt/screenshot — same type allowlist as any
// other image upload, plus PDF since some banks only issue a PDF confirmation.
const ALLOWED_SLIP_TYPES = [...ALLOWED_PHOTO_TYPES, 'application/pdf'];

/**
 * Public membership registration — called by the club's landing page's Join form
 * (components/landing/ui/JoinModal.tsx). No auth: anyone visiting the site can
 * apply. Every submission lands as `status: 'pending'` and only an admin (not
 * lms_manager) can act on it from here — see /api/members. next.config.ts already
 * serves /api/* with Access-Control-Allow-Origin: *, so the landing page can call
 * this from any origin.
 *
 * multipart/form-data, not JSON — the form includes a required photo and a
 * required payment slip.
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const form = await request.formData();

    const fullName = String(form.get('fullName') ?? '').trim();
    const phone = String(form.get('phone') ?? '').trim();
    const nic = String(form.get('nic') ?? '').trim();
    const photo = form.get('photo');
    const paymentSlip = form.get('paymentSlip');
    const ageValue = form.get('age');
    const age = ageValue ? parseInt(String(ageValue), 10) : undefined;

    if (!fullName) return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    if (!phone) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    if (!isValidPhone(phone)) return NextResponse.json({ error: 'Phone must contain only digits, with an optional leading +' }, { status: 400 });
    if (!nic && isNicRequired(age)) {
      return NextResponse.json({ error: 'NIC number is required for applicants 16 or older' }, { status: 400 });
    }
    const whatsappValue = form.get('whatsapp');
    if (typeof whatsappValue === 'string' && whatsappValue.trim() && !isValidPhone(whatsappValue)) {
      return NextResponse.json({ error: 'WhatsApp number must contain only digits, with an optional leading +' }, { status: 400 });
    }
    const guardianPhoneValue = form.get('guardianPhone');
    if (typeof guardianPhoneValue === 'string' && guardianPhoneValue.trim() && !isValidPhone(guardianPhoneValue)) {
      return NextResponse.json({ error: 'Guardian phone must contain only digits, with an optional leading +' }, { status: 400 });
    }
    const dobValue = form.get('dateOfBirth');
    if (typeof dobValue === 'string' && dobValue.trim() && !isPastDate(dobValue)) {
      return NextResponse.json({ error: 'Date of birth must be in the past' }, { status: 400 });
    }
    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json({ error: 'A photo is required' }, { status: 400 });
    }
    if (!ALLOWED_PHOTO_TYPES.includes(photo.type)) {
      return NextResponse.json({ error: `Unsupported image type: ${photo.type || 'unknown'}` }, { status: 415 });
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: 'Photo is larger than 8MB' }, { status: 413 });
    }

    const jobCategoryValue = String(form.get('jobCategory') ?? '');
    if (!isJobCategory(jobCategoryValue)) {
      return NextResponse.json({ error: 'Please select an occupation category' }, { status: 400 });
    }
    const jobOther = String(form.get('jobOther') ?? '').trim();
    if (jobCategoryValue === 'other' && !jobOther) {
      return NextResponse.json({ error: 'Please describe your occupation' }, { status: 400 });
    }

    if (!(paymentSlip instanceof File) || paymentSlip.size === 0) {
      return NextResponse.json({ error: 'A payment slip is required' }, { status: 400 });
    }
    if (!ALLOWED_SLIP_TYPES.includes(paymentSlip.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${paymentSlip.type || 'unknown'}` }, { status: 415 });
    }
    if (paymentSlip.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: 'Payment slip is larger than 8MB' }, { status: 413 });
    }

    if (!isSpacesConfigured()) {
      return NextResponse.json({ error: 'Uploads are not configured yet — contact the club.' }, { status: 503 });
    }

    const emailValue = String(form.get('email') ?? '').trim();
    const duplicateError = await findDuplicateMemberError({ age, email: emailValue, phone, nic });
    if (duplicateError) return NextResponse.json({ error: duplicateError }, { status: 409 });

    // A public, unauthenticated endpoint accepting free text is an easy spam vector —
    // capping field lengths here keeps a bad-faith submission from writing an
    // arbitrarily large document, independent of whatever the landing page validates.
    const cap = (v: FormDataEntryValue | null, max: number) =>
      typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;

    const photoBuffer = Buffer.from(await photo.arrayBuffer());
    const uploadedPhoto = await uploadImage(photoBuffer, photo.name, SPACES_MEMBERS_FOLDER, photo.type);

    const slipBuffer = Buffer.from(await paymentSlip.arrayBuffer());
    const uploadedSlip = await uploadImage(slipBuffer, paymentSlip.name, SPACES_PAYMENTS_FOLDER, paymentSlip.type);

    const member = await Member.create({
      fullName: fullName.slice(0, 120),
      phone: phone.slice(0, 30),
      nic: nic ? nic.slice(0, 30) : undefined,
      photoUrl: uploadedPhoto.url,
      photoPublicId: uploadedPhoto.publicId,
      email: cap(form.get('email'), 254),
      dateOfBirth: form.get('dateOfBirth') ? new Date(String(form.get('dateOfBirth'))) : undefined,
      age,
      gender: cap(form.get('gender'), 20),
      whatsapp: cap(form.get('whatsapp'), 30),
      dateOfJoining: form.get('dateOfJoining') ? new Date(String(form.get('dateOfJoining'))) : undefined,
      previousClub: cap(form.get('previousClub'), 120),
      address: cap(form.get('address'), 300),
      guardianName: cap(form.get('guardianName'), 120),
      guardianPhone: cap(form.get('guardianPhone'), 30),
      memberType: cap(form.get('memberType'), 60),
      job: jobCategoryValue === 'other' ? jobOther.slice(0, 80) : jobLabel(jobCategoryValue),
      jobCategory: jobCategoryValue,
      annualFee: jobFee(jobCategoryValue),
      paymentSlipUrl: uploadedSlip.url,
      paymentSlipPublicId: uploadedSlip.publicId,
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
