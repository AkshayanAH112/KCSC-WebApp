import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Student, Batch, Counter } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';
import { isValidLocalPhone, isPastDate } from '@/lib/validation';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');
    const batchId = searchParams.get('batchId');

    let query: any = {};
    if (grade) query.grade = Number(grade);
    if (batchId) query.batchId = batchId;

    const students = await Student.find(query).populate('batchId').sort({ createdAt: -1 });
    return NextResponse.json({ students });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const data = await request.json();

    if (!data.batchId) {
      return NextResponse.json({ error: 'A batch is required to register a student' }, { status: 400 });
    }
    if (!isValidLocalPhone(data.guardianPhone)) {
      return NextResponse.json({ error: 'Guardian phone must be a valid 10-digit number starting with 0 (e.g. 0701212234)' }, { status: 400 });
    }
    if (!isPastDate(data.dateOfBirth)) {
      return NextResponse.json({ error: 'Date of birth must be in the past' }, { status: 400 });
    }

    // Auto-generate unique QR code
    const uniqueId = crypto.randomBytes(4).toString('hex').toUpperCase();
    data.qrCode = `KCSC-${data.grade}-${uniqueId}`;

    // Registration number "KCSC/{batch year}/{0001..}" — sequenced per batch
    // year via an atomic counter, not a countDocuments() count: numbers must
    // never be reused even after a student is later deleted, and two admins
    // registering students back-to-back must never race onto the same number.
    const batch = await Batch.findById(data.batchId);
    const regYear = batch?.year ?? new Date().getFullYear();
    const counter = await Counter.findOneAndUpdate(
      { _id: `regno-${regYear}` },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    data.registrationNumber = `KCSC/${regYear}/${String(counter.seq).padStart(4, '0')}`;
    data.registrationDate = data.registrationDate ? new Date(data.registrationDate) : new Date();

    const student = await Student.create(data);
    return NextResponse.json({ student }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
