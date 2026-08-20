import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Student, ClassSession, Attendance } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

/**
 * Raw JSON for the attendance Excel export — the file itself is built
 * client-side with the `xlsx` package (same pattern as the Marks Excel
 * template), this route only assembles the data.
 *
 * GET /api/attendance/export?from=2026-08-01&to=2026-08-31&grade=&batchId=
 */
export async function GET(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    if (!fromParam || !toParam) {
      return NextResponse.json({ error: 'from and to dates are required' }, { status: 400 });
    }
    const from = new Date(fromParam);
    const to = new Date(toParam);
    to.setUTCHours(23, 59, 59, 999);

    const grade = searchParams.get('grade');
    const batchId = searchParams.get('batchId');

    const sessionQuery: Record<string, unknown> = { date: { $gte: from, $lte: to } };
    if (grade) sessionQuery.grade = Number(grade);
    if (batchId) sessionQuery.batchId = batchId;

    const sessions = await ClassSession.find(sessionQuery).populate('batchId').sort({ date: 1 });
    if (sessions.length === 0) {
      return NextResponse.json({ range: { from: from.toISOString(), to: to.toISOString() }, sessions: [], rows: [] });
    }

    const [rosterStudents, attendanceRecords] = await Promise.all([
      Student.find({ $or: sessions.map((s) => ({ batchId: s.batchId, grade: s.grade })) }).populate('batchId'),
      Attendance.find({ classId: { $in: sessions.map((s) => s._id.toString()) } }),
    ]);

    const rows = rosterStudents.map((student) => {
      const byClassId: Record<string, 'present' | 'leave' | 'not_eligible' | 'not_recorded'> = {};
      let totalPresent = 0;
      let totalLeaves = 0;
      let eligibleCount = 0;

      for (const session of sessions) {
        const onRoster =
          student.batchId?._id?.toString() === session.batchId._id.toString() && student.grade === session.grade;
        if (!onRoster) continue;

        // Mid-batch registration: a class before the student's registration
        // date was never something they could have attended.
        const eligible = !student.registrationDate || student.registrationDate <= session.date;
        if (!eligible) {
          byClassId[session._id.toString()] = 'not_eligible';
          continue;
        }

        eligibleCount += 1;
        const record = attendanceRecords.find(
          (a) => a.studentId.toString() === student._id.toString() && a.classId.toString() === session._id.toString()
        );
        if (record?.present) {
          byClassId[session._id.toString()] = 'present';
          totalPresent += 1;
        } else if (record?.countedAsLeave) {
          byClassId[session._id.toString()] = 'leave';
          totalLeaves += 1;
        } else {
          // Eligible but never marked either way — same treatment as the
          // existing /api/analysis roster math: it still counts against the
          // eligible denominator, it just isn't a recorded leave.
          byClassId[session._id.toString()] = 'not_recorded';
        }
      }

      return {
        studentId: student._id.toString(),
        registrationNumber: student.registrationNumber ?? '—',
        name: student.name,
        batchName: student.batchId?.name ?? '—',
        byClassId,
        totalPresent,
        totalLeaves,
        eligibleCount,
        attendancePercent: eligibleCount > 0 ? Math.round((totalPresent / eligibleCount) * 100) : null,
      };
    });

    return NextResponse.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      sessions: sessions.map((s) => ({
        _id: s._id.toString(),
        date: s.date,
        subject: s.subject,
        grade: s.grade,
        batchName: s.batchId?.name ?? '—',
      })),
      rows: rows.filter((r) => r.eligibleCount > 0 || Object.keys(r.byClassId).length > 0),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
