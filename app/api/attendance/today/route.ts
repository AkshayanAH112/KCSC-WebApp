import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ClassSession, Student, Attendance } from '@/models';
import { getTodayRange } from '@/lib/dateRange';
import { isStaffRequest } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { start, end } = getTodayRange();

    const sessions = await ClassSession.find({ date: { $gte: start, $lt: end } })
      .populate('batchId')
      .sort({ time: 1 });

    if (sessions.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    const sessionIds = sessions.map((s) => s._id.toString());
    const [rosterStudents, attendanceRecords] = await Promise.all([
      Student.find({ $or: sessions.map((s) => ({ batchId: s.batchId, grade: s.grade })) }).sort({ name: 1 }),
      Attendance.find({ classId: { $in: sessionIds } }),
    ]);

    const result = sessions.map((session) => {
      const roster = rosterStudents.filter(
        (s) =>
          s.batchId?.toString() === session.batchId._id.toString() &&
          s.grade === session.grade &&
          // Mid-batch registrations are only on the roster for classes dated on
          // or after they joined. /api/dashboard/stats applies the same rule, and
          // the two must agree or the dashboard card and this page disagree about
          // how many students were expected. Legacy students (no registrationDate)
          // are grandfathered in.
          (!s.registrationDate || s.registrationDate <= session.date)
      );
      return {
        classSession: session,
        roster: roster.map((student) => {
          const record = attendanceRecords.find(
            (a) => a.studentId.toString() === student._id.toString() && a.classId.toString() === session._id.toString()
          );
          return {
            student,
            isPresent: record ? record.present : false,
            // Distinguishes "explicitly marked absent" from "never scanned at
            // all". Both read as not-present, but only the former is a leave:
            // countedAsLeave is written by POST /api/attendance, so a student
            // nobody scanned has no Attendance row and never affects
            // totalLeaves or the 2/3-leave warnings.
            isRecorded: Boolean(record),
          };
        }),
      };
    });

    return NextResponse.json({ sessions: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
