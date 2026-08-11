import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Student, ClassSession, Attendance, Marks, Post } from '@/models';
import { getTodayRange } from '@/lib/dateRange';
import { countLowAttendanceStudents } from '@/lib/attendanceStats';

export async function GET() {
  try {
    await connectToDatabase();
    const { start, end } = getTodayRange();

    const [totalStudents, todaySessions, recentMarks, lowAttendanceCount, publishedPosts] =
      await Promise.all([
        Student.countDocuments({ isActive: true }),
        ClassSession.find({ date: { $gte: start, $lt: end } }),
        Marks.countDocuments({ createdAt: { $gte: start, $lt: end } }),
        countLowAttendanceStudents(),
        Post.countDocuments({ status: 'published' }),
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
          (s) => s.batchId?.toString() === session.batchId.toString() && s.grade === session.grade
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

    return NextResponse.json({
      totalStudents,
      hasClassesToday,
      todayAttendance: `${attendancePercent}%`,
      presentToday: presentRosterSlots,
      expectedToday: totalRosterSlots,
      absentToday: Math.max(0, totalRosterSlots - presentRosterSlots),
      lowAttendanceCount,
      publishedPosts,
      recentMarks,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
