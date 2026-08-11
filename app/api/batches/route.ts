import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Batch } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const batches = await Batch.find().sort({ createdAt: -1 });
    return NextResponse.json({ batches });
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
    const batch = await Batch.create(data);
    return NextResponse.json({ batch }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
