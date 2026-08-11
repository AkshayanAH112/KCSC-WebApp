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
 */
export async function getAttendanceRates(): Promise<StudentAttendanceRate[]> {
  const rows = await Attendance.aggregate([
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
