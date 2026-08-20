import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import { Member } from '@/models';
import { isAdminOnlyRequest, getAuthPayload } from '@/lib/auth-guard';
import { isValidPhone, isPastDate } from '@/lib/validation';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const member = await Member.findById(id).populate('reviewedBy', 'email');
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    return NextResponse.json({ member });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Approve/reject/edit. Stamps reviewedBy + reviewedAt the moment status first leaves 'pending'. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const existing = await Member.findById(id);
    if (!existing) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const data = await request.json();

    if (data.phone !== undefined && !isValidPhone(data.phone)) {
      return NextResponse.json({ error: 'Phone must contain only digits, with an optional leading +' }, { status: 400 });
    }
    if (data.whatsapp && !isValidPhone(data.whatsapp)) {
      return NextResponse.json({ error: 'WhatsApp number must contain only digits, with an optional leading +' }, { status: 400 });
    }
    if (data.guardianPhone && !isValidPhone(data.guardianPhone)) {
      return NextResponse.json({ error: 'Guardian phone must contain only digits, with an optional leading +' }, { status: 400 });
    }
    if (data.dateOfBirth && !isPastDate(data.dateOfBirth)) {
      return NextResponse.json({ error: 'Date of birth must be in the past' }, { status: 400 });
    }

    const update: Record<string, unknown> = { ...data };

    if (data.status && data.status !== existing.status && existing.status === 'pending') {
      update.reviewedBy = auth.userId;
      update.reviewedAt = new Date();
    }

    // Card "MEMBER ID" — assigned once, the moment a member is first approved.
    // Same format as Student.qrCode (app/api/students/route.ts), just an 'M' marker
    // instead of a grade since general club membership isn't grade-scoped.
    if (data.status === 'approved' && existing.status !== 'approved' && !existing.memberCode) {
      update.memberCode = `KCSC-M-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }

    const member = await Member.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    return NextResponse.json({ member });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const member = await Member.findByIdAndDelete(id);
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
