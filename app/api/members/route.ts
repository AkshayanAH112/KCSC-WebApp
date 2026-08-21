import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Member, MEMBER_STATUSES, Counter } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';
import { isValidPhone, isPastDate } from '@/lib/validation';
import { isJobCategory, jobFee, jobLabel, oneYearFrom, computeAge } from '@/lib/membership';
import { findDuplicateMemberError } from '@/lib/member-duplicate-check';

/**
 * Admin-only. An lms_manager token is valid but still gets 401 here — that boundary
 * is the entire point of the second role. See lib/auth-guard.ts.
 */
export async function GET(request: Request) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query = status && MEMBER_STATUSES.includes(status as any) ? { status } : {};

    const members = await Member.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Manual entry for a walk-in signup — defaults to 'approved' since the admin is present. */
export async function POST(request: Request) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const data = await request.json();
    if (!data.fullName?.trim()) return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    if (!data.phone?.trim()) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    if (!isValidPhone(data.phone)) return NextResponse.json({ error: 'Phone must contain only digits, with an optional leading +' }, { status: 400 });
    if (data.whatsapp && !isValidPhone(data.whatsapp)) {
      return NextResponse.json({ error: 'WhatsApp number must contain only digits, with an optional leading +' }, { status: 400 });
    }
    if (data.guardianPhone && !isValidPhone(data.guardianPhone)) {
      return NextResponse.json({ error: 'Guardian phone must contain only digits, with an optional leading +' }, { status: 400 });
    }
    if (data.dateOfBirth && !isPastDate(data.dateOfBirth)) {
      return NextResponse.json({ error: 'Date of birth must be in the past' }, { status: 400 });
    }

    const age = data.dateOfBirth ? computeAge(data.dateOfBirth) : undefined;
    const duplicateError = await findDuplicateMemberError({
      age,
      email: data.email,
      phone: data.phone,
      nic: data.nic,
    });
    if (duplicateError) return NextResponse.json({ error: duplicateError }, { status: 409 });

    const status = data.status ?? 'approved';
    const extra: Record<string, unknown> = {};
    if (isJobCategory(data.jobCategory)) {
      extra.jobCategory = data.jobCategory;
      extra.annualFee = jobFee(data.jobCategory);
      extra.job = data.jobCategory === 'other' ? String(data.jobOther ?? '').trim().slice(0, 80) : jobLabel(data.jobCategory);
    }
    // A walk-in is entered as already-approved by the admin present, so it gets
    // the same one-year validity window — and the same sequential member code —
    // an online approval sets (see PATCH /api/members/[id]).
    if (status === 'approved') {
      const validFrom = new Date();
      extra.validFrom = validFrom;
      extra.validUntil = oneYearFrom(validFrom);
      const counter = await Counter.findOneAndUpdate(
        { _id: 'membercode' },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );
      extra.memberCode = `KCSC-M-${String(counter.seq).padStart(4, '0')}`;
    }

    const member = await Member.create({ ...data, ...extra, status });
    return NextResponse.json({ member }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
