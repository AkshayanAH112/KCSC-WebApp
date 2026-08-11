import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Attendance, Student, ClassSession } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

export async function POST(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { studentId, classId, present } = await request.json();

    const student = await Student.findById(studentId);
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const classSession = await ClassSession.findById(classId);
    if (!classSession) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    const att = await Attendance.findOneAndUpdate(
      { studentId: student._id, classId },
      { present: present !== false, date: new Date() },
      { upsert: true, new: true }
    );

    // Running attendance tally for this student, so the scanner can flag
    // a pattern of absence right at check-in.
    const [attendedCount, recordedCount] = await Promise.all([
      Attendance.countDocuments({ studentId: student._id, present: true }),
      Attendance.countDocuments({ studentId: student._id }),
    ]);

    return NextResponse.json({
      success: true,
      attendance: att,
      attendedCount,
      recordedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
