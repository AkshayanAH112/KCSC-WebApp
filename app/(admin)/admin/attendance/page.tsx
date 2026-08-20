"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Loader2, Search, Download, FileSpreadsheet } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  present: "Present",
  leave: "Leave",
  not_recorded: "—",
  not_eligible: "N/A",
};

export default function AttendanceExportPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [grade, setGrade] = useState("");
  const [batchId, setBatchId] = useState("");
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/batches").then((r) => r.json()).then((d) => setBatches(d.batches || []));
  }, []);

  const generate = async () => {
    if (!from || !to) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      if (grade) params.set("grade", grade);
      if (batchId) params.set("batchId", batchId);
      const res = await fetch(`/api/attendance/export?${params}`);
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (!result) return;
    const header = ["Registration Number", "Student Name", "Batch", ...result.sessions.map((s: any) =>
      `${new Date(s.date).toLocaleDateString()}${s.subject ? ` (${s.subject})` : ""}`
    ), "Total Present", "Total Leaves", "Attendance %"];

    const sheetRows = result.rows.map((row: any) => {
      const dailyCells = result.sessions.map((s: any) => STATUS_LABEL[row.byClassId[s._id]] ?? "N/A");
      return [
        row.registrationNumber,
        row.name,
        row.batchName,
        ...dailyCells,
        row.totalPresent,
        row.totalLeaves,
        row.attendancePercent !== null ? `${row.attendancePercent}%` : "—",
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([header, ...sheetRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `KCSC_Attendance_${from}_to_${to}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance Report</h1>
        <p className="text-muted-foreground">Select a date range to generate and download an attendance report.</p>
      </div>

      <div className="grid gap-4 rounded-lg border border-border bg-card p-6 shadow-xs sm:grid-cols-4">
        <div>
          <label className="field-label">From Date</label>
          <input type="date" required className="field" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="field-label">To Date</label>
          <input type="date" required className="field" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Grade</label>
          <select className="field cursor-pointer" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">All Grades</option>
            <option value="3">Grade 3</option>
            <option value="4">Grade 4</option>
            <option value="5">Grade 5</option>
          </select>
        </div>
        <div>
          <label className="field-label">Batch</label>
          <select className="field cursor-pointer" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-4 flex gap-3">
          <button
            onClick={generate}
            disabled={loading || !from || !to}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            Generate
          </button>
          {result && result.rows.length > 0 && (
            <button
              onClick={downloadExcel}
              className="flex items-center gap-2 rounded-lg border-2 border-primary px-4 py-2 font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <Download size={18} /> Download Excel
            </button>
          )}
        </div>
      </div>

      {result && (
        result.rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-16 text-center">
            <FileSpreadsheet size={40} className="text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No class sessions found for this range.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary font-medium text-secondary-foreground">
                  <tr>
                    <th className="px-4 py-3">Reg. Number</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Present</th>
                    <th className="px-4 py-3">Leaves</th>
                    <th className="px-4 py-3">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.rows.map((row: any) => (
                    <tr key={row.studentId}>
                      <td className="px-4 py-2 font-mono text-xs">{row.registrationNumber}</td>
                      <td className="px-4 py-2 font-semibold text-foreground">{row.name}</td>
                      <td className="px-4 py-2 text-muted-foreground">{row.batchName}</td>
                      <td className="px-4 py-2 tabular">{row.totalPresent}</td>
                      <td className="px-4 py-2 tabular">{row.totalLeaves}</td>
                      <td className="px-4 py-2">
                        {row.attendancePercent !== null ? (
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{row.attendancePercent}%</span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
