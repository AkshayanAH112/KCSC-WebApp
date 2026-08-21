import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Member, Counter } from '@/models';
import { isAdminOnlyRequest, getAuthPayload } from '@/lib/auth-guard';
import { isValidPhone, isPastDate } from '@/lib/validation';
import { deleteImage } from '@/lib/spaces';
import { oneYearFrom } from '@/lib/membership';

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
    // Sequential, same atomic Counter pattern as Student.registrationNumber
    // (app/api/students/route.ts), just not year-scoped — club membership
    // numbering runs as one continuous sequence.
    if (data.status === 'approved' && existing.status !== 'approved' && !existing.memberCode) {
      const counter = await Counter.findOneAndUpdate(
        { _id: 'membercode' },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );
      update.memberCode = `KCSC-M-${String(counter.seq).padStart(4, '0')}`;
    }

    // The membership period — one year from the moment it's (first) approved.
    if (data.status === 'approved' && existing.status !== 'approved') {
      const validFrom = new Date();
      update.validFrom = validFrom;
      update.validUntil = oneYearFrom(validFrom);
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

    await deleteImage(member.photoPublicId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
