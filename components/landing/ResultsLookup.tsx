"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  Trophy,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Info,
} from "lucide-react";
import { useTranslations } from "next-intl";
import GlassCard from "@/components/landing/ui/GlassCard";
import Button from "@/components/landing/ui/Button";

type ExamResult = {
  examId: string;
  name: string | null;
  subject: string;
  examDate: string;
  maxMarks: number;
  isAbsent: boolean;
  marks: number | null;
  percent: number | null;
  classAverage: number | null;
  rank: number | null;
  outOf: number;
};

type Payload = {
  student: {
    name: string;
    grade: number;
    registrationNumber: string;
    batchName: string | null;
  };
  results: ExamResult[];
  summary: {
    examsPublished: number;
    examsCounted: number;
    averagePercent: number | null;
    rank: number | null;
    outOf: number;
    subjects: { subject: string; averagePercent: number; examsCounted: number }[];
  } | null;
};

// Day-first, matching how dates are written locally, and identical in both
// locales — the table is dense enough without month names changing width.
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const examLabel = (exam: ExamResult) =>
  exam.name ? `${exam.subject} — ${exam.name}` : exam.subject;

export default function ResultsLookup() {
  const t = useTranslations("ResultsPage");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [examFilter, setExamFilter] = useState("all");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setData(null);
    setExamFilter("all");

    try {
      const res = await fetch("/api/public/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: query }),
      });
      const payload = await res.json();
      if (!res.ok) {
        // The route's messages are already parent-facing prose ("check the card
        // and try again"), so they are shown as-is rather than mapped to a
        // generic string that would throw away the useful part.
        setError(payload?.error ?? t("error_generic"));
        return;
      }
      setData(payload);
    } catch {
      setError(t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setQuery("");
    setExamFilter("all");
  };

  const visibleResults = useMemo(() => {
    if (!data) return [];
    return examFilter === "all"
      ? data.results
      : data.results.filter((r) => r.examId === examFilter);
  }, [data, examFilter]);

  const subjects = data?.summary?.subjects ?? [];
  const strongest = subjects[0];
  // Only call out a weakest subject when there is a spread to talk about —
  // with one subject, "strongest" and "needs work" would be the same row.
  const weakest = subjects.length > 1 ? subjects[subjects.length - 1] : null;

  return (
    <div className="flex flex-col gap-8">
      {/* ---------- Lookup form ---------- */}
      <GlassCard className="p-6 md:p-8">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label
            htmlFor="registrationNumber"
            className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary-container"
          >
            {t("label")}
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="registrationNumber"
              name="registrationNumber"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("placeholder")}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="w-full flex-1 rounded-full border border-tertiary-container/30 bg-surface-container/60 px-5 py-3 text-on-primary-container outline-none transition-colors placeholder:text-on-surface-variant/50 focus:border-tertiary-container focus-visible:ring-2 focus-visible:ring-secondary"
            />
            <Button
              type="submit"
              disabled={loading || !query.trim()}
              className="shrink-0 justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} /> {t("searching")}
                </>
              ) : (
                <>
                  <Search className="mr-2" size={16} /> {t("submit")}
                </>
              )}
            </Button>
          </div>

          <p className="text-xs leading-relaxed text-on-surface-variant">{t("hint")}</p>
        </form>
      </GlassCard>

      {/* ---------- Error ---------- */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-error/40 bg-error-container/20 p-4 text-sm text-on-error-container"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* ---------- Results ---------- */}
      {data && (
        <div className="flex flex-col gap-6">
          {/* Student identity */}
          <GlassCard className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-extrabold wrap-break-word text-on-primary-container md:text-3xl">
                {data.student.name}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {t("grade", { grade: data.student.grade })}
                {data.student.batchName ? ` · ${data.student.batchName}` : ""} ·{" "}
                <span className="tabular-nums">{data.student.registrationNumber}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex shrink-0 cursor-pointer items-center gap-2 self-start rounded-full border border-tertiary-container/30 px-4 py-2 text-xs font-bold text-tertiary-fixed transition-colors hover:border-tertiary-container hover:text-on-primary-container sm:self-auto"
            >
              <RotateCcw size={14} /> {t("another")}
            </button>
          </GlassCard>

          {data.results.length === 0 || !data.summary ? (
            <GlassCard className="p-8 text-center">
              <h3 className="font-display text-xl font-bold text-on-primary-container">
                {t("empty_title")}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant">
                {t("empty_body")}
              </p>
            </GlassCard>
          ) : (
            <>
              {/* Headline numbers */}
              <div className="grid gap-4 sm:grid-cols-3">
                <GlassCard className="p-5 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-tertiary-container">
                    {t("average")}
                  </p>
                  <p className="mt-2 font-display text-4xl font-extrabold tabular-nums text-gradient-gold">
                    {data.summary.averagePercent ?? "—"}
                    {data.summary.averagePercent !== null && (
                      <span className="text-2xl">%</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {t("exams_counted", { count: data.summary.examsCounted })}
                  </p>
                </GlassCard>

                <GlassCard className="p-5 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-tertiary-container">
                    {t("rank")}
                  </p>
                  <p className="mt-2 font-display text-4xl font-extrabold tabular-nums text-gradient-gold">
                    {data.summary.rank ?? "—"}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {data.summary.rank !== null && t("of_students", { total: data.summary.outOf })}
                  </p>
                </GlassCard>

                <GlassCard className="flex flex-col justify-center gap-3 p-5">
                  {strongest && (
                    <div className="flex items-center gap-2.5">
                      <TrendingUp size={16} className="shrink-0 text-tertiary-container" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          {t("strongest")}
                        </p>
                        <p className="truncate text-sm font-bold text-on-primary-container">
                          {strongest.subject}{" "}
                          <span className="tabular-nums text-tertiary-fixed">
                            {strongest.averagePercent}%
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                  {weakest && (
                    <div className="flex items-center gap-2.5">
                      <TrendingDown size={16} className="shrink-0 text-on-surface-variant" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          {t("weakest")}
                        </p>
                        <p className="truncate text-sm font-bold text-on-primary-container">
                          {weakest.subject}{" "}
                          <span className="tabular-nums text-on-surface-variant">
                            {weakest.averagePercent}%
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Per-exam filter */}
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="examFilter"
                  className="text-xs font-bold uppercase tracking-widest text-on-surface-variant"
                >
                  {t("filter_label")}
                </label>
                <select
                  id="examFilter"
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  className="cursor-pointer rounded-full border border-tertiary-container/30 bg-surface-container px-4 py-2 text-sm text-on-primary-container outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  <option value="all">{t("filter_all")}</option>
                  {data.results.map((exam) => (
                    <option key={exam.examId} value={exam.examId}>
                      {examLabel(exam)} · {formatDate(exam.examDate)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Desktop table */}
              <GlassCard className="hidden overflow-hidden p-0 md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-tertiary-container/20 bg-surface-container/40">
                      <tr className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                        <th className="px-5 py-3">{t("col_exam")}</th>
                        <th className="px-5 py-3">{t("col_date")}</th>
                        <th className="px-5 py-3">{t("col_marks")}</th>
                        <th className="px-5 py-3">{t("col_percent")}</th>
                        <th className="px-5 py-3">{t("col_class_avg")}</th>
                        <th className="px-5 py-3">{t("col_rank")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-tertiary-container/10">
                      {visibleResults.map((exam) => (
                        <tr key={exam.examId} className="transition-colors hover:bg-surface-container/30">
                          <td className="px-5 py-3.5 font-semibold text-on-primary-container">
                            {examLabel(exam)}
                          </td>
                          <td className="px-5 py-3.5 text-on-surface-variant">
                            {formatDate(exam.examDate)}
                          </td>
                          {exam.isAbsent ? (
                            // An absent paper stores marks as 0. Rendering that
                            // zero would read to a parent as a score of nought,
                            // so the whole row collapses to one honest label.
                            <td colSpan={4} className="px-5 py-3.5">
                              <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-bold text-on-surface-variant">
                                {t("absent")}
                              </span>
                              <span className="ml-2 text-xs text-on-surface-variant/70">
                                {t("absent_note")}
                              </span>
                            </td>
                          ) : (
                            <>
                              <td className="px-5 py-3.5 tabular-nums text-on-primary-container">
                                {exam.marks}
                                <span className="text-on-surface-variant">/{exam.maxMarks}</span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="rounded-full bg-primary-container/40 px-2.5 py-1 text-xs font-bold tabular-nums text-tertiary-fixed">
                                  {exam.percent}%
                                </span>
                              </td>
                              <td className="px-5 py-3.5 tabular-nums text-on-surface-variant">
                                {exam.classAverage !== null ? `${exam.classAverage}%` : "—"}
                              </td>
                              <td className="px-5 py-3.5 tabular-nums text-on-primary-container">
                                <span className="inline-flex items-center gap-1.5">
                                  {exam.rank === 1 && (
                                    <Trophy size={13} className="text-tertiary-container" />
                                  )}
                                  {exam.rank}
                                  <span className="text-on-surface-variant">/{exam.outOf}</span>
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>

              {/* Mobile cards — the same six values, stacked, because a
                  six-column table on a 360px phone is unreadable either
                  scrolled sideways or squeezed. */}
              <div className="flex flex-col gap-3 md:hidden">
                {visibleResults.map((exam) => (
                  <GlassCard key={exam.examId} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold wrap-break-word text-on-primary-container">
                          {examLabel(exam)}
                        </p>
                        <p className="mt-0.5 text-xs text-on-surface-variant">
                          {formatDate(exam.examDate)}
                        </p>
                      </div>
                      {exam.isAbsent ? (
                        <span className="shrink-0 rounded-full bg-surface-container px-2.5 py-1 text-xs font-bold text-on-surface-variant">
                          {t("absent")}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-primary-container/40 px-3 py-1 text-sm font-bold tabular-nums text-tertiary-fixed">
                          {exam.percent}%
                        </span>
                      )}
                    </div>

                    {exam.isAbsent ? (
                      <p className="mt-3 text-xs text-on-surface-variant/70">{t("absent_note")}</p>
                    ) : (
                      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-tertiary-container/15 pt-3 text-center">
                        <div>
                          <dt className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                            {t("col_marks")}
                          </dt>
                          <dd className="mt-1 text-sm font-bold tabular-nums text-on-primary-container">
                            {exam.marks}/{exam.maxMarks}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                            {t("col_class_avg")}
                          </dt>
                          <dd className="mt-1 text-sm font-bold tabular-nums text-on-surface-variant">
                            {exam.classAverage !== null ? `${exam.classAverage}%` : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                            {t("col_rank")}
                          </dt>
                          <dd className="mt-1 inline-flex items-center gap-1 text-sm font-bold tabular-nums text-on-primary-container">
                            {exam.rank === 1 && <Trophy size={12} className="text-tertiary-container" />}
                            {exam.rank}/{exam.outOf}
                          </dd>
                        </div>
                      </dl>
                    )}
                  </GlassCard>
                ))}
              </div>

              {/* How the numbers were arrived at — a rank with no stated basis
                  invites the wrong reading, especially where absences are
                  involved. */}
              <div className="flex items-start gap-3 rounded-2xl border border-tertiary-container/15 bg-surface-container/30 p-4">
                <Info size={16} className="mt-0.5 shrink-0 text-tertiary-container" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-tertiary-container">
                    {t("note_title")}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                    {t("note_body")}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
