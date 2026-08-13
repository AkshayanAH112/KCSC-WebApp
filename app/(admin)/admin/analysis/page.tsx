"use client";

import { useEffect, useState } from "react";
import { Loader2, LineChart, Trophy } from "lucide-react";

type StudentResult = {
  studentId: string;
  name: string;
  grade: number;
  examCount: number;
  avgMarksPercent: number | null;
  attendancePercent: number | null;
  combinedScore: number | null;
  partial: boolean;
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const today = new Date();
const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

export default function AnalysisPage() {
  const [start, setStart] = useState(isoDate(thirtyDaysAgo));
  const [end, setEnd] = useState(isoDate(today));
  const [grade, setGrade] = useState("");
  const [batches, setBatches] = useState<any[]>([]);
  const [batchId, setBatchId] = useState("");
  const [results, setResults] = useState<StudentResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/batches")
      .then((r) => r.json())
      .then((d) => setBatches(d.batches || []));
  }, []);

  const runReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ start, end });
      if (grade) params.set("grade", grade);
      if (batchId) params.set("batchId", batchId);
      const res = await fetch(`/api/analysis?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.students);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gradeBatches = batches.filter((b) => !grade || b.grades?.includes(Number(grade)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-foreground">Analysis</h1>
        <p className="text-muted-foreground">
          Rank students by exam results and attendance together, over any date range.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-card p-6 shadow-xs sm:grid-cols-4">
        <div>
          <label className="field-label">From</label>
          <input type="date" className="field" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="field-label">To</label>
          <input type="date" className="field" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Grade</label>
          <select
            className="field cursor-pointer"
            value={grade}
            onChange={(e) => {
              setGrade(e.target.value);
              setBatchId("");
            }}
          >
            <option value="">All grades</option>
            <option value="3">Grade 3</option>
            <option value="4">Grade 4</option>
            <option value="5">Grade 5</option>
          </select>
        </div>
        <div>
          <label className="field-label">Batch</label>
          <select className="field cursor-pointer" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">All batches</option>
            {gradeBatches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={runReport}
          disabled={loading}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:opacity-60 sm:col-span-4"
        >
          {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <LineChart size={16} aria-hidden />}
          Run report
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Combined score = average of avg. exam % and attendance % over the selected range. Where a student
        only has one of the two in range, that single figure is used and the row is marked{" "}
        <span className="font-semibold">partial</span>.
      </p>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : !results || results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-16 text-center">
          <Trophy size={40} className="text-muted-foreground opacity-50" aria-hidden />
          <p className="text-muted-foreground">No marks or attendance recorded in this range yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary font-medium text-secondary-foreground">
                <tr>
                  <th className="px-6 py-3">Rank</th>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Grade</th>
                  <th className="px-6 py-3">Exams</th>
                  <th className="px-6 py-3">Avg. Marks</th>
                  <th className="px-6 py-3">Attendance</th>
                  <th className="px-6 py-3">Combined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((r, i) => (
                  <tr key={r.studentId} className="transition-colors duration-200 hover:bg-muted">
                    <td className="px-6 py-2.5 font-bold text-foreground">{i + 1}</td>
                    <td className="px-6 py-2.5 font-semibold text-foreground">{r.name}</td>
                    <td className="px-6 py-2.5 text-muted-foreground">Grade {r.grade}</td>
                    <td className="px-6 py-2.5 text-muted-foreground">{r.examCount}</td>
                    <td className="px-6 py-2.5 text-muted-foreground">
                      {r.avgMarksPercent === null ? "—" : `${r.avgMarksPercent}%`}
                    </td>
                    <td className="px-6 py-2.5 text-muted-foreground">
                      {r.attendancePercent === null ? "—" : `${r.attendancePercent}%`}
                    </td>
                    <td className="px-6 py-2.5">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                        {r.combinedScore === null ? "—" : `${r.combinedScore}%`}
                      </span>
                      {r.partial && <span className="ml-2 text-xs text-muted-foreground">partial</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
