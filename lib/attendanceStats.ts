import { Attendance } from '@/models';

/** Attendance rate below this is treated as "needs follow-up". */
export const LOW_ATTENDANCE_THRESHOLD = 0.75;

export type StudentAttendanceRate = {
  studentId: string;
  attended: number;
  total: number;
  rate: number;
};

/**
 * Attendance rate per student, computed from recorded rows only.
 * A student with no recorded sessions is omitted rather than scored 0% —
 * a new student should not show up as a follow-up case on their first day.
 *
 * Scoped to each student's CURRENT grade (via their class session's grade,
 * not just studentId) — a student promoted from grade 4 to grade 5 (see
 * app/api/cron/promote-students) keeps their same _id and Attendance history,
 * but that grade-4 history must not blend into their "fresh" grade-5 rate.
 */
export async function getAttendanceRates(): Promise<StudentAttendanceRate[]> {
  const rows = await Attendance.aggregate([
    {
      $lookup: {
        from: 'classsessions',
        localField: 'classId',
        foreignField: '_id',
        as: 'session',
      },
    },
    { $unwind: '$session' },
    {
      $lookup: {
        from: 'students',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: '$student' },
    { $match: { $expr: { $eq: ['$session.grade', '$student.grade'] } } },
    {
      $group: {
        _id: '$studentId',
        attended: { $sum: { $cond: ['$present', 1, 0] } },
        total: { $sum: 1 },
      },
    },
  ]);

  return rows
    .filter((r: any) => r.total > 0)
    .map((r: any) => ({
      studentId: String(r._id),
      attended: r.attended,
      total: r.total,
      rate: r.attended / r.total,
    }));
}

export async function countLowAttendanceStudents(
  threshold: number = LOW_ATTENDANCE_THRESHOLD
): Promise<number> {
  const rates = await getAttendanceRates();
  return rates.filter((r) => r.rate < threshold).length;
}
