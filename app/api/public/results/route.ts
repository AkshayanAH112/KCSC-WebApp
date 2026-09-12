import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Student, Exam, Marks } from '@/models';

/**
 * Public exam-results lookup — no auth. Backs the /results page on the
 * marketing site, so a parent can find their child's marks using the
 * registration number printed on the student card.
 *
 * POST rather than GET on purpose: the registration number identifies a
 * specific child, and a GET would park it in browser history, in the Referer
 * header of every outbound link, and in request logs. Nothing here is
 * cacheable anyway.
 *
 * Two things bound what this can leak. Only exams an admin has explicitly
 * published (Exam.isPublished) are visible at all; and the response is
 * assembled field by field rather than returning the Student document, so
 * guardianPhone/address/school/leave counts cannot reach it by accident when
 * someone later adds a field to the schema.
 *
 * POST /api/public/results   { "registrationNumber": "KCSC/2026/0001" }
 */

// Per-IP throttle. On Vercel each serverless instance keeps its own Map, so
// this is best-effort — it stops a casual script, not a distributed one. It is
// the only brake on this route: lookup is by registration number alone, with
// no second factor, which is a deliberate product decision.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  // Crude bound so a long-lived instance cannot accumulate every IP it ever saw.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length > MAX_PER_WINDOW;
}

/**
 * Accepts what a parent actually types. The stored form is always
 * "KCSC/{year}/{0001}" (4-digit, zero-padded — see app/api/students/route.ts),
 * but "kcsc/2026/1" is the far more likely keystroke, so case, stray spaces
 * and missing padding are all normalised rather than rejected.
 */
function normalizeRegNo(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().replace(/\s+/g, '').toUpperCase().match(/^KCSC\/(\d{4})\/(\d{1,6})$/);
  if (!match) return null;
  return `KCSC/${match[1]}/${match[2].padStart(4, '0')}`;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Standard competition ranking over descending scores — 1, 2, 2, 4. */
function rankOf(allScores: number[], score: number): number {
  return allScores.filter((s) => s > score).length + 1;
}

export async function POST(request: Request) {
  try {
    const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many lookups from this connection. Please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const registrationNumber = normalizeRegNo(body?.registrationNumber);
    if (!registrationNumber) {
      return NextResponse.json(
        { error: 'Enter the registration number as it appears on the student card, e.g. KCSC/2026/0001.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const student = await Student.findOne({ registrationNumber })
      .select('name grade registrationNumber batchId')
      .populate('batchId', 'name');

    if (!student) {
      return NextResponse.json(
        { error: 'No student found with that registration number. Please check the card and try again.' },
        { status: 404 }
      );
    }

    // This student's marks, narrowed to published exams. `examId: { $ne: null }`
    // also drops legacy rows that predate the Exam model (see
    // /api/exams/backfill) — with no Exam behind them there is nothing to
    // publish, so they stay private permanently. That is the intended outcome.
    const ownMarks = await Marks.find({ studentId: student._id, examId: { $ne: null } })
      .select('examId marks maxMarks isAbsent');

    const publishedExams = await Exam.find({
      _id: { $in: ownMarks.map((m) => m.examId) },
      isPublished: true,
    })
      .select('subject name examDate maxMarks')
      .sort({ examDate: -1 });

    const studentSummary = {
      name: student.name,
      grade: student.grade,
      registrationNumber: student.registrationNumber,
      batchName: (student.batchId as { name?: string } | null)?.name ?? null,
    };

    if (publishedExams.length === 0) {
      return NextResponse.json({ student: studentSummary, results: [], summary: null });
    }

    // Every mark for those same exams, from every student who sat them. This is
    // the cohort the ranks are computed against — "among the students who sat
    // the same papers" — rather than the whole batch, which may include
    // students who never sat some of these exams and would skew the placing.
    const cohortMarks = await Marks.find({ examId: { $in: publishedExams.map((e) => e._id) } })
      .select('studentId examId marks maxMarks isAbsent');

    const marksByExam = new Map<string, typeof cohortMarks>();
    for (const mark of cohortMarks) {
      const key = mark.examId.toString();
      const bucket = marksByExam.get(key);
      if (bucket) bucket.push(mark);
      else marksByExam.set(key, [mark]);
    }

    const results = publishedExams.map((exam) => {
      const key = exam._id.toString();
      const mine = ownMarks.find((m) => m.examId?.toString() === key)!;

      // Absent papers are excluded from every average and from the ranking —
      // an absent student's `marks` is stored as 0, which is not a score.
      const scored = (marksByExam.get(key) ?? []).filter((m) => !m.isAbsent && m.maxMarks > 0);
      const percents = scored.map((m) => (m.marks / m.maxMarks) * 100);
      const myPercent = mine.isAbsent || !mine.maxMarks ? null : (mine.marks / mine.maxMarks) * 100;

      return {
        examId: key,
        name: exam.name ?? null,
        subject: exam.subject,
        examDate: exam.examDate,
        maxMarks: exam.maxMarks,
        isAbsent: Boolean(mine.isAbsent),
        marks: mine.isAbsent ? null : mine.marks,
        percent: myPercent === null ? null : round1(myPercent),
        classAverage: percents.length
          ? round1(percents.reduce((a, b) => a + b, 0) / percents.length)
          : null,
        rank: myPercent === null ? null : rankOf(percents, myPercent),
        outOf: scored.length,
      };
    });

    // Overall placing: each student's average % across these same exams.
    const totals = new Map<string, { total: number; count: number }>();
    for (const mark of cohortMarks) {
      if (mark.isAbsent || !mark.maxMarks) continue;
      const key = mark.studentId.toString();
      const entry = totals.get(key) ?? { total: 0, count: 0 };
      entry.total += (mark.marks / mark.maxMarks) * 100;
      entry.count += 1;
      totals.set(key, entry);
    }

    const averages = [...totals.values()].map((e) => e.total / e.count);
    const own = totals.get(student._id.toString());
    const ownAverage = own ? own.total / own.count : null;

    // Per-subject averages, so the page can name a strongest and weakest
    // subject instead of leaving a parent to eyeball the table.
    const bySubject = new Map<string, { total: number; count: number }>();
    for (const result of results) {
      if (result.percent === null) continue;
      const entry = bySubject.get(result.subject) ?? { total: 0, count: 0 };
      entry.total += result.percent;
      entry.count += 1;
      bySubject.set(result.subject, entry);
    }

    const subjects = [...bySubject.entries()]
      .map(([subject, e]) => ({
        subject,
        averagePercent: round1(e.total / e.count),
        examsCounted: e.count,
      }))
      .sort((a, b) => b.averagePercent - a.averagePercent);

    return NextResponse.json({
      student: studentSummary,
      results,
      summary: {
        examsPublished: results.length,
        examsCounted: own?.count ?? 0,
        averagePercent: ownAverage === null ? null : round1(ownAverage),
        rank: ownAverage === null ? null : rankOf(averages, ownAverage),
        outOf: averages.length,
        subjects,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
