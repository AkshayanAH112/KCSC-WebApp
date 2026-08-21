import { Member } from '@/models';
import { isMinor } from '@/lib/membership';

/**
 * For adult applicants, email/phone/NIC must each be unique across Member —
 * minors are exempt since they often share a guardian's phone/email and may
 * have no NIC at all (see lib/membership.ts's isNicRequired). Used by both
 * the public join form and the admin walk-in form, so a duplicate can't slip
 * in through either path.
 */
export async function findDuplicateMemberError(params: {
  age?: number;
  email?: string;
  phone?: string;
  nic?: string;
  excludeId?: string;
}): Promise<string | null> {
  const { age, email, phone, nic, excludeId } = params;
  if (isMinor(age)) return null;

  const or: Record<string, string>[] = [];
  if (email) or.push({ email });
  if (phone) or.push({ phone });
  if (nic) or.push({ nic });
  if (or.length === 0) return null;

  const query: Record<string, unknown> = { $or: or };
  if (excludeId) query._id = { $ne: excludeId };

  const existing = await Member.findOne(query);
  if (!existing) return null;

  if (phone && existing.phone === phone) return 'A member with this phone number already exists.';
  if (email && existing.email === email) return 'A member with this email already exists.';
  if (nic && existing.nic === nic) return 'A member with this NIC number already exists.';
  return 'A member with matching details already exists.';
}
