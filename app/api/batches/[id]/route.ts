import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Batch, ClassSession, Student, Exam } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const batch = await Batch.findById(id);
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

    const classes = await ClassSession.find({ batchId: id }).sort({ date: -1 });

    return NextResponse.json({ batch, classes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    const data = await request.json();

    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.year !== undefined) update.year = data.year;
    if (data.grades !== undefined) update.grades = data.grades;

    const batch = await Batch.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    return NextResponse.json({ batch });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    // A batch is a shared parent across three independent domains (roster,
    // schedule, exams) — cascading would be irreversible multi-entity data
    // loss from one click, and this app has no undo anywhere.
    const [studentCount, classCount, examCount] = await Promise.all([
      Student.countDocuments({ batchId: id }),
      ClassSession.countDocuments({ batchId: id }),
      Exam.countDocuments({ batchId: id }),
    ]);
    if (studentCount > 0 || classCount > 0 || examCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${studentCount} student(s), ${classCount} class session(s), and ${examCount} exam(s) still reference this batch` },
        { status: 409 }
      );
    }

    const batch = await Batch.findByIdAndDelete(id);
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
