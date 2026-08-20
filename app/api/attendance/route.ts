import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Attendance, Student, ClassSession, Notification } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

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

    // countedAsLeave is the source of truth for "has this row already
    // contributed to the counters" — the increment/decrement below is a pure
    // function of the transition, so re-toggling the same class back and
    // forth (correcting a mistake) never double- or under-counts.
    const prior = await Attendance.findOne({ studentId, classId });
    const wasCounted = prior?.countedAsLeave ?? false;
    const nextPresent = present !== false;
    const nowCounted = !nextPresent;

    const att = await Attendance.findOneAndUpdate(
      { studentId: student._id, classId },
      { present: nextPresent, date: new Date(), countedAsLeave: nowCounted, ...(remarks !== undefined ? { remarks } : {}) },
      { upsert: true, new: true }
    );

    const delta = (nowCounted ? 1 : 0) - (wasCounted ? 1 : 0);
    let updatedStudent = student;

    if (delta !== 0) {
      updatedStudent = await Student.findByIdAndUpdate(
        studentId,
        { $inc: { totalLeaves: delta, currentLeaveCycle: delta } },
        { new: true }
      );
      // Defensive clamp — the transition math above shouldn't be able to push
      // this negative, but guards against any out-of-band manual DB edit.
      if (updatedStudent.currentLeaveCycle < 0) {
        updatedStudent = await Student.findByIdAndUpdate(studentId, { currentLeaveCycle: 0 }, { new: true });
      }

      if (delta === 1) {
        // A genuinely new leave (not a repeat toggle) — stamp the cycle value
        // it landed on, permanently, for the leave-history ledger.
        await Attendance.findByIdAndUpdate(att._id, { leaveCycleAtRecord: updatedStudent.currentLeaveCycle });

        if (updatedStudent.currentLeaveCycle === 2 || updatedStudent.currentLeaveCycle === 3) {
          const priorLeaves = await Attendance.find({
            studentId,
            countedAsLeave: true,
            leaveCycleAtRecord: { $gte: 1, $lte: updatedStudent.currentLeaveCycle },
          }).sort({ date: 1 });

          await Notification.findOneAndUpdate(
            {
              studentId,
              type: updatedStudent.currentLeaveCycle === 2 ? 'parent_warning' : 'admin_critical',
              cycleGeneration: updatedStudent.cycleGeneration,
            },
            {
              $setOnInsert: {
                registrationNumber: updatedStudent.registrationNumber,
                studentName: updatedStudent.name,
                leaveCount: updatedStudent.currentLeaveCycle,
                leaveDates: priorLeaves.map((l) => l.date),
              },
            },
            { upsert: true, new: true }
          );
        }
      }
    }

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
