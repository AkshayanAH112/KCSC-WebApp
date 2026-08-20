import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Student, ClassSession, Attendance, Marks, Post, Member } from '@/models';
import { getTodayRange } from '@/lib/dateRange';
import { countLowAttendanceStudents } from '@/lib/attendanceStats';
import { getAuthPayload } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { start, end } = getTodayRange();

    const [
      totalStudents,
      todaySessions,
      recentMarks,
      lowAttendanceCount,
      publishedPosts,
      pendingMembers,
      studentsAtCycle2,
      studentsAtCycle3,
      deactivatedStudents,
    ] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      ClassSession.find({ date: { $gte: start, $lt: end } }),
      Marks.countDocuments({ createdAt: { $gte: start, $lt: end } }),
      countLowAttendanceStudents(),
      Post.countDocuments({ status: 'published' }),
      // Only an admin can act on membership applications, so an lms_manager
      // shouldn't even see the count — keeps the dashboard honest about what
      // this session can do.
      auth.role === 'admin' ? Member.countDocuments({ status: 'pending' }) : null,
      Student.countDocuments({ isActive: true, currentLeaveCycle: 2 }),
      Student.countDocuments({ isActive: true, currentLeaveCycle: 3 }),
      Student.countDocuments({ isActive: false }),
    ]);

    // Today's attendance %: roster = students matching any (batchId, grade)
    // combo among today's sessions, scored against attendance for those
    // exact class sessions — not a blind date-range scan of Attendance.date,
    // which only reflects when a record was last edited.
    const hasClassesToday = todaySessions.length > 0;
    let totalRosterSlots = 0;
    let presentRosterSlots = 0;

    if (hasClassesToday) {
      const sessionIds = todaySessions.map((s) => s._id.toString());
      const rosterStudents = await Student.find({
        $or: todaySessions.map((s) => ({ batchId: s.batchId, grade: s.grade })),
      });
      const todayAttendanceRecords = await Attendance.find({ classId: { $in: sessionIds } });

      for (const session of todaySessions) {
        const roster = rosterStudents.filter(
          (s) =>
            s.batchId?.toString() === session.batchId.toString() &&
            s.grade === session.grade &&
            (!s.registrationDate || s.registrationDate <= session.date)
        );
        totalRosterSlots += roster.length;
        for (const student of roster) {
          const record = todayAttendanceRecords.find(
            (a) => a.studentId.toString() === student._id.toString() && a.classId.toString() === session._id.toString()
          );
          if (record?.present) presentRosterSlots++;
        }
      }
    }

    const attendancePercent = totalRosterSlots > 0
      ? Math.round((presentRosterSlots / totalRosterSlots) * 100)
      : 0;

    // Distinct students marked absent (a leave) on any of today's sessions.
    const studentsOnLeaveToday = new Set(
      (await Attendance.find({
        classId: { $in: todaySessions.map((s) => s._id.toString()) },
        countedAsLeave: true,
      })).map((a) => a.studentId.toString())
    ).size;

    return NextResponse.json({
      totalStudents,
      hasClassesToday,
      todayAttendance: `${attendancePercent}%`,
      presentToday: presentRosterSlots,
      expectedToday: totalRosterSlots,
      absentToday: Math.max(0, totalRosterSlots - presentRosterSlots),
      lowAttendanceCount,
      publishedPosts,
      pendingMembers,
      recentMarks,
      studentsOnLeaveToday,
      studentsAtCycle2,
      studentsAtCycle3,
      deactivatedStudents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
