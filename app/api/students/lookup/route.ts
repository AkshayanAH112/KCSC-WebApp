import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Student, Attendance, ClassSession } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const qrCode = searchParams.get('qrCode');
    const classId = searchParams.get('classId');

    if (!qrCode) return NextResponse.json({ error: 'QR code missing' }, { status: 400 });

    const student = await Student.findOne({ qrCode }).populate('batchId');
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // Attendance history, so the scanner can surface a poor-attendance flag at check-in.
    const records = await Attendance.find({ studentId: student._id });
    const recordedCount = records.length;
    const attendedCount = records.filter((a) => a.present).length;
    const attendanceRate = recordedCount > 0 ? Math.round((attendedCount / recordedCount) * 100) : null;

    // Classless lookup — used by the "Find Student" scanner mode, which just
    // needs to jump to the student's profile without any class context.
    if (!classId) {
      return NextResponse.json({ student, attendedCount, recordedCount, attendanceRate });
    }

    const classSession = await ClassSession.findById(classId);
    if (!classSession) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    // Validate grade matches
    if (student.grade !== classSession.grade) {
      return NextResponse.json({ error: `Warning: Student is Grade ${student.grade}, Class is Grade ${classSession.grade}` }, { status: 400 });
    }

    // Mid-batch registration guard — advisory here (POST /api/attendance is
    // the hard block); legacy students with no registrationDate are grandfathered.
    if (student.registrationDate && classSession.date < student.registrationDate) {
      return NextResponse.json(
        { error: `Warning: Student registered on ${student.registrationDate.toDateString()}, after this class (${classSession.date.toDateString()})` },
        { status: 400 }
      );
    }

    // Check if they are already present today
    const currentAtt = await Attendance.findOne({ studentId: student._id, classId: classSession._id });

    return NextResponse.json({
      student,
      attendedCount,
      recordedCount,
      attendanceRate,
      existingRecord: currentAtt
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
