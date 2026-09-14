// This app serves one school in Sri Lanka (UTC+5:30, no DST). Vercel runs
// serverless functions in UTC, so `new Date().setHours(0,0,0,0)` computes
// midnight in the wrong timezone — a class at 8pm local time could fall on
// the wrong side of the boundary. Compute "today" using a fixed offset instead.
const SRI_LANKA_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function getTodayRange() {
  const nowLocal = new Date(Date.now() + SRI_LANKA_OFFSET_MS);
  const startLocal = new Date(Date.UTC(
    nowLocal.getUTCFullYear(),
    nowLocal.getUTCMonth(),
    nowLocal.getUTCDate()
  ));
  const start = new Date(startLocal.getTime() - SRI_LANKA_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * The same local-day window as getTodayRange(), but for an arbitrary instant —
 * used to line an Exam up with the ClassSessions held on its date.
 *
 * Both examDate and ClassSession.date come from <input type="date">, so they
 * land in Mongo as UTC midnight for the intended local day. Comparing those two
 * instants directly would still be wrong for any session that carries a real
 * time component, so match on the local day window rather than on equality.
 */
export function getDayRange(date: Date | string) {
  const instant = new Date(date);
  const local = new Date(instant.getTime() + SRI_LANKA_OFFSET_MS);
  const startLocal = new Date(Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate()
  ));
  const start = new Date(startLocal.getTime() - SRI_LANKA_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}
