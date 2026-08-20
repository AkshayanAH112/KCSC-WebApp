/**
 * Shared server-side validation for fields multiple forms accept free text
 * into (phone numbers, dates of birth) — enforced here too, not just as HTML
 * input attributes, since those are trivially bypassed by a direct API call.
 */

// General phone check — digits only, with an optional leading +. No spaces,
// hyphens, parens, or letters. Used for Member phone/whatsapp/guardianPhone,
// where an international number is legitimate (diaspora/foreign members) —
// the public Join form's placeholder is "+94771234567".
const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;

export function isValidPhone(value: unknown): value is string {
  return typeof value === 'string' && PHONE_PATTERN.test(value.trim());
}

// Stricter local Sri Lankan format for Student.guardianPhone specifically:
// exactly 10 digits, starting with 0 (e.g. 0701212234). Every family in the
// free tuition programme is local, so this is deliberately narrower than the
// general check above rather than reused from it.
const LOCAL_PHONE_PATTERN = /^0\d{9}$/;

export function isValidLocalPhone(value: unknown): value is string {
  return typeof value === 'string' && LOCAL_PHONE_PATTERN.test(value.replace(/[\s-]/g, ''));
}

export function isPastDate(value: unknown): boolean {
  if (typeof value !== 'string' && !(value instanceof Date)) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}
