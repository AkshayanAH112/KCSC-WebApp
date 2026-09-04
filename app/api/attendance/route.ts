import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Attendance, Student, ClassSession } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';
import { recordAttendance } from '@/lib/attendance-recorder';

export async function POST(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { studentId, classId, present, remarks } = await request.json();

    const student = await Student.findById(studentId);
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const classSession = await ClassSession.findById(classId);
    if (!classSession) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    // This is the authoritative write path both Scanner UIs and the class
    // roster toggle funnel through — the roster query already excludes
    // ineligible students from view, and the Scanner lookup already warns,
    // but neither is a hard server-side block, so both checks belong here too.
    if (student.grade !== classSession.grade) {
      return NextResponse.json(
        { error: `Student is Grade ${student.grade}, class is Grade ${classSession.grade}` },
        { status: 400 }
      );
    }
    if (student.registrationDate && classSession.date < student.registrationDate) {
      return NextResponse.json(
        {
          error: `Cannot record attendance: student registered on ${student.registrationDate.toDateString()}, after this class (${classSession.date.toDateString()})`,
        },
        { status: 400 }
      );
    }

    // Shared with the bulk "end class" action — see lib/attendance-recorder.ts
    // for why the leave/notification logic lives there rather than inline here.
    const { attendance: att, student: updatedStudent } = await recordAttendance({
      studentId,
      classId,
      present,
      remarks,
    });

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
      totalLeaves: updatedStudent.totalLeaves,
      currentLeaveCycle: updatedStudent.currentLeaveCycle,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
