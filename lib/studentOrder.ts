/**
 * One ordering rule for every student roster staff read down: index number
 * (Student.registrationNumber, "KCSC/{year}/{0001}") ascending.
 *
 * Applied server-side rather than in each page, so the mobile app's rosters
 * come out in the same order as the web app's without a second implementation.
 *
 * Two details the naive `.sort({ registrationNumber: 1 })` gets wrong:
 *
 * - registrationNumber is `sparse` — students created before it existed have
 *   none until backfilled (see /api/students/backfill-registration-numbers).
 *   Mongo sorts those nulls *first*, which would put the unidentifiable rows at
 *   the top of every register. They belong at the end, by name.
 * - The sequence is zero-padded to 4 digits, so a plain string compare is
 *   already numerically correct within a year, and puts older years first
 *   across them. That is the intended reading order, so no parsing is needed.
 */
type OrderableStudent = {
  registrationNumber?: string | null;
  name?: string | null;
};

export function compareByIndexNumber(a: OrderableStudent, b: OrderableStudent): number {
  const aNo = a.registrationNumber ?? '';
  const bNo = b.registrationNumber ?? '';

  if (aNo && bNo) return aNo.localeCompare(bNo);
  // Exactly one side is unnumbered: it sorts after every numbered student.
  if (aNo) return -1;
  if (bNo) return 1;
  return (a.name ?? '').localeCompare(b.name ?? '');
}

/** Convenience wrapper: returns a new array, leaving the input untouched. */
export function sortByIndexNumber<T extends OrderableStudent>(students: T[]): T[] {
  return [...students].sort(compareByIndexNumber);
}
