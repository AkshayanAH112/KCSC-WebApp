/**
 * Shared between the public join/renewal forms and their API routes — the fee
 * is always resolved server-side from `jobCategory`, never trusted from the
 * client, so this table is the one source of truth for both.
 */
export const JOB_CATEGORIES = [
  { value: 'school_student', label: 'School Student', fee: 100 },
  { value: 'undergraduate', label: 'Undergraduate', fee: 200 },
  { value: 'other', label: 'Other', fee: 1000 },
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number]['value'];

export function isJobCategory(value: unknown): value is JobCategory {
  return typeof value === 'string' && JOB_CATEGORIES.some((c) => c.value === value);
}

export function jobFee(category: JobCategory): number {
  return JOB_CATEGORIES.find((c) => c.value === category)!.fee;
}

export function jobLabel(category: JobCategory): string {
  return JOB_CATEGORIES.find((c) => c.value === category)!.label;
}

/** Annual membership fee currency — Sri Lankan Rupees. */
export const FEE_CURRENCY = 'LKR';

export const CLUB_BANK_DETAILS = {
  accountName: 'Kallar Cricket Club',
  bankName: 'BOC',
  branch: 'Kallar Branch',
  accountNumber: '72258393',
};

/** A membership card / renewal period is valid for one year from approval. */
export function oneYearFrom(date: Date): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

/** NIC is only meaningful (and legally obtainable in Sri Lanka) from age 16. */
export function isNicRequired(age: unknown): boolean {
  const n = typeof age === 'number' ? age : parseInt(String(age), 10);
  return !(Number.isFinite(n) && n < 16);
}

/** Age of majority — minors are exempt from the email/phone/NIC uniqueness
 * check (lib/member-duplicate-check.ts), since they often share a guardian's
 * contact details and may have no NIC at all. */
export function isMinor(age: unknown): boolean {
  const n = typeof age === 'number' ? age : parseInt(String(age), 10);
  return Number.isFinite(n) && n < 18;
}

export function computeAge(dateOfBirth: Date | string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
