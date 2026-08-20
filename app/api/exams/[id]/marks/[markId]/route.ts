import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Marks } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

export async function PATCH(request: Request, context: { params: Promise<{ id: string, markId: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id, markId } = await context.params;
    const data = await request.json();

    const update: Record<string, unknown> = {};
    if (data.marks !== undefined) update.marks = data.marks;

    const mark = await Marks.findOneAndUpdate({ _id: markId, examId: id }, update, { new: true, runValidators: true });
    if (!mark) return NextResponse.json({ error: 'Mark not found for this exam' }, { status: 404 });
    return NextResponse.json({ mark });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string, markId: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id, markId } = await context.params;

    const mark = await Marks.findOneAndDelete({ _id: markId, examId: id });
    if (!mark) return NextResponse.json({ error: 'Mark not found for this exam' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
