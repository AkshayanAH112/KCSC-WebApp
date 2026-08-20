import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ClassSession, Student, Attendance } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    // 1. Fetch Class Session
    const classSession = await ClassSession.findById(id).populate('batchId');
    if (!classSession) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    // 2. Fetch all eligible students for this class based on Batch and Grade —
    // excluding anyone who registered after this class's date (mid-batch
    // registration: they were never enrolled when this class happened).
    const students = await Student.find({
        batchId: classSession.batchId._id,
        grade: classSession.grade,
        $or: [{ registrationDate: { $exists: false } }, { registrationDate: { $lte: classSession.date } }],
    }).sort({ name: 1 });

    // 3. Fetch existing attendance records for this class
    const attendanceRecords = await Attendance.find({ classId: id });

    // 4. Map them together
    const roster = students.map(student => {
        const record = attendanceRecords.find(a => a.studentId.toString() === student._id.toString());
        return {
            student,
            isPresent: record ? record.present : false,
            isRecorded: Boolean(record),
            attendanceId: record ? record._id : null
        };
    });

    return NextResponse.json({ classSession, roster });
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
    if (data.batchId !== undefined) update.batchId = data.batchId;
    if (data.grade !== undefined) update.grade = data.grade;
    if (data.date !== undefined) update.date = data.date;
    if (data.time !== undefined) update.time = data.time;
    if (data.subject !== undefined) update.subject = data.subject;

    const classSession = await ClassSession.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!classSession) return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    return NextResponse.json({ classSession });
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

    // A session with recorded Attendance is a historical fact created by a
    // different workflow (the QR scanner) than the one asking to delete it —
    // block. A session that was scheduled but never taken is safe to remove.
    const attendanceCount = await Attendance.countDocuments({ classId: id });
    if (attendanceCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${attendanceCount} attendance record(s) already exist for this class` },
        { status: 409 }
      );
    }

    const classSession = await ClassSession.findByIdAndDelete(id);
    if (!classSession) return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
