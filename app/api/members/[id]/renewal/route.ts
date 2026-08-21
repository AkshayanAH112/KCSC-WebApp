import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Member } from '@/models';
import { isAdminOnlyRequest, getAuthPayload } from '@/lib/auth-guard';
import { deleteImage } from '@/lib/spaces';
import { oneYearFrom } from '@/lib/membership';

/** Approve a pending renewal — promotes the renewal fields onto the member's
 * current period and extends validUntil a year from today. The old payment
 * slip is deleted since the new one replaces it as the record on file. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const member = await Member.findById(id);
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if (member.renewalStatus !== 'pending') {
      return NextResponse.json({ error: 'This member has no pending renewal' }, { status: 400 });
    }

    await deleteImage(member.paymentSlipPublicId);

    const validFrom = new Date();
    member.job = member.renewalJob;
    member.jobCategory = member.renewalJobCategory;
    member.annualFee = member.renewalAnnualFee;
    member.paymentSlipUrl = member.renewalPaymentSlipUrl;
    member.paymentSlipPublicId = member.renewalPaymentSlipPublicId;
    member.validFrom = validFrom;
    member.validUntil = oneYearFrom(validFrom);
    member.reviewedBy = auth.userId;
    member.reviewedAt = validFrom;

    member.renewalStatus = 'none';
    member.renewalJob = undefined;
    member.renewalJobCategory = undefined;
    member.renewalAnnualFee = undefined;
    member.renewalPaymentSlipUrl = undefined;
    member.renewalPaymentSlipPublicId = undefined;
    member.renewalSubmittedAt = undefined;

    await member.save();
    return NextResponse.json({ member });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Reject a pending renewal — the member's current period is untouched. */
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const member = await Member.findById(id);
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if (member.renewalStatus !== 'pending') {
      return NextResponse.json({ error: 'This member has no pending renewal' }, { status: 400 });
    }

    await deleteImage(member.renewalPaymentSlipPublicId);

    member.renewalStatus = 'none';
    member.renewalJob = undefined;
    member.renewalJobCategory = undefined;
    member.renewalAnnualFee = undefined;
    member.renewalPaymentSlipUrl = undefined;
    member.renewalPaymentSlipPublicId = undefined;
    member.renewalSubmittedAt = undefined;

    await member.save();
    return NextResponse.json({ member });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
