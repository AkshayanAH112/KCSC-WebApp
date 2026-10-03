import { Attendance, Student, Notification, ClassSession } from '@/models';

/**
 * The single write path for attendance.
 *
 * Extracted from POST /api/attendance so the bulk "end class" action
 * (POST /api/classes/[id]/end) records leaves through exactly the same code.
 * Duplicating any of this is how the two paths would drift: a student marked
 * absent one way would raise a parent warning, the other way silently would
 * not, and totalLeaves would stop matching the Attendance rows behind it.
 *
 * Callers are responsible for validating that the student belongs on the
 * session's roster (grade match, registrationDate eligibility) before calling.
 */
export type RecordResult = {
  attendance: any;
  student: any;
  /** +1 a new leave was counted, -1 one was reversed, 0 nothing changed. */
  delta: number;
};

export async function recordAttendance(opts: {
  studentId: string;
  classId: string;
  present: boolean;
  remarks?: string;
}): Promise<RecordResult> {
  const { studentId, classId, present, remarks } = opts;

  // countedAsLeave is the source of truth for "has this row already contributed
  // to the counters". The increment below is a pure function of the transition,
  // so re-toggling the same class back and forth (correcting a mistake) never
  // double-counts, and ending a class twice never counts a second leave.
  const [prior, session] = await Promise.all([
    Attendance.findOne({ studentId, classId }),
    ClassSession.findById(classId),
  ]);
  const wasCounted = prior?.countedAsLeave ?? false;
  const nextPresent = present !== false;
  const nowCounted = !nextPresent;
  const sessionDate = session?.date ?? new Date();

  const att = await Attendance.findOneAndUpdate(
    { studentId, classId },
    {
      present: nextPresent,
      date: sessionDate,
      countedAsLeave: nowCounted,
      ...(remarks !== undefined ? { remarks } : {}),
    },
    { upsert: true, new: true }
  );

  const delta = (nowCounted ? 1 : 0) - (wasCounted ? 1 : 0);
  let student = await Student.findById(studentId);

  if (delta !== 0) {
    student = await Student.findByIdAndUpdate(
      studentId,
      { $inc: { totalLeaves: delta, currentLeaveCycle: delta } },
      { new: true }
    );
    // Defensive clamp — the transition math above shouldn't be able to push
    // this negative, but guards against any out-of-band manual DB edit.
    if (student.currentLeaveCycle < 0) {
      student = await Student.findByIdAndUpdate(studentId, { currentLeaveCycle: 0 }, { new: true });
    }

    if (delta === 1) {
      // A genuinely new leave (not a repeat toggle) — stamp the cycle value it
      // landed on, permanently, for the leave-history ledger.
      await Attendance.findByIdAndUpdate(att._id, { leaveCycleAtRecord: student.currentLeaveCycle });

      if (student.currentLeaveCycle === 2 || student.currentLeaveCycle === 3) {
        const priorLeaves = await Attendance.find({
          studentId,
          countedAsLeave: true,
          leaveCycleAtRecord: { $gte: 1, $lte: student.currentLeaveCycle },
        }).sort({ date: 1 });

        await Notification.findOneAndUpdate(
          {
            studentId,
            type: student.currentLeaveCycle === 2 ? 'parent_warning' : 'admin_critical',
            cycleGeneration: student.cycleGeneration,
          },
          {
            $setOnInsert: {
              registrationNumber: student.registrationNumber,
              studentName: student.name,
              leaveCount: student.currentLeaveCycle,
              leaveDates: priorLeaves.map((l) => l.date),
            },
          },
          { upsert: true, new: true }
        );
      }
    }
  }

  return { attendance: att, student, delta };
}
