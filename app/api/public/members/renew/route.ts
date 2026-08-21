import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Member } from '@/models';
import { uploadImage, isSpacesConfigured, SPACES_PAYMENTS_FOLDER } from '@/lib/spaces';
import { isValidPhone } from '@/lib/validation';
import { isJobCategory, jobFee, jobLabel } from '@/lib/membership';

const MAX_SLIP_BYTES = 8 * 1024 * 1024;
const ALLOWED_SLIP_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'];

/**
 * Public membership renewal — a returning member re-pays the annual fee and
 * uploads a new slip against their EXISTING record, rather than filing a new
 * application. No auth: looked up by phone (+ NIC when the member has one on
 * file — under-16 members never collected one, see lib/membership.ts).
 *
 * Lands in `renewalStatus: 'pending'` alongside the member's current, still-
 * active fields — approving it (POST /api/members/[id]/renewal) is what
 * actually extends validUntil; this route only records the request.
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const form = await request.formData();

    const phone = String(form.get('phone') ?? '').trim();
    const nic = String(form.get('nic') ?? '').trim();
    const paymentSlip = form.get('paymentSlip');

    if (!phone) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: 'Phone must contain only digits, with an optional leading +' }, { status: 400 });
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
    if (paymentSlip.size > MAX_SLIP_BYTES) {
      return NextResponse.json({ error: 'Payment slip is larger than 8MB' }, { status: 413 });
    }
    if (!isSpacesConfigured()) {
      return NextResponse.json({ error: 'Uploads are not configured yet — contact the club.' }, { status: 503 });
    }

    const query: Record<string, unknown> = { phone, status: 'approved' };
    if (nic) query.nic = nic;
    const member = await Member.findOne(query);
    if (!member) {
      return NextResponse.json(
        { error: 'No approved membership found matching that phone number' + (nic ? ' and NIC' : '') + '. Contact the club if you believe this is a mistake.' },
        { status: 404 }
      );
    }

    const slipBuffer = Buffer.from(await paymentSlip.arrayBuffer());
    const uploadedSlip = await uploadImage(slipBuffer, paymentSlip.name, SPACES_PAYMENTS_FOLDER, paymentSlip.type);

    member.renewalStatus = 'pending';
    member.renewalJobCategory = jobCategoryValue;
    member.renewalJob = jobCategoryValue === 'other' ? jobOther.slice(0, 80) : jobLabel(jobCategoryValue);
    member.renewalAnnualFee = jobFee(jobCategoryValue);
    member.renewalPaymentSlipUrl = uploadedSlip.url;
    member.renewalPaymentSlipPublicId = uploadedSlip.publicId;
    member.renewalSubmittedAt = new Date();
    await member.save();

    return NextResponse.json(
      { success: true, message: 'Renewal submitted — the club will verify your payment and confirm shortly.' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
