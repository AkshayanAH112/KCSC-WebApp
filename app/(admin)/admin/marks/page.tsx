"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, Download, Loader2, Plus, X, GraduationCap } from "lucide-react";

type MarkRecord = {
  _id: string;
  studentId: { _id: string; name: string; qrCode: string } | null;
  subject: string;
  examDate: string;
  marks: number;
  maxMarks: number;
  grade: number;
  batchId: { _id: string; name: string } | null;
};

type Exam = {
  key: string;
  subject: string;
  grade: number;
  batchName: string;
  examDate: string;
  results: MarkRecord[];
  averagePercent: number;
};

export default function MarksPage() {
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, bRes] = await Promise.all([fetch("/api/marks"), fetch("/api/batches")]);
      const mData = await mRes.json();
      const bData = await bRes.json();
      setMarks(mData.marks || []);
      setBatches(bData.batches || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Exams aren't their own record — an "exam" is every mark that shares a
  // (subject, grade, batch, date). Records saved before batchId existed group
  // under "No batch" rather than being silently dropped.
  const exams = useMemo<Exam[]>(() => {
    const groups = new Map<string, MarkRecord[]>();
    for (const m of marks) {
      const dateKey = new Date(m.examDate).toDateString();
      const key = `${m.subject}|${m.grade}|${m.batchId?._id ?? "none"}|${dateKey}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }
    return Array.from(groups.entries())
      .map(([key, results]) => {
        const totalPercent = results.reduce((sum, r) => sum + (r.marks / r.maxMarks) * 100, 0);
        return {
          key,
          subject: results[0].subject,
          grade: results[0].grade,
          batchName: results[0].batchId?.name ?? "No batch on record",
          examDate: results[0].examDate,
          results,
          averagePercent: Math.round(totalPercent / results.length),
        };
      })
      .sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());
  }, [marks]);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marks &amp; Reporting</h1>
          <p className="text-muted-foreground">Every exam entered, with results per student.</p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
        >
          <Plus size={18} aria-hidden /> New Exam
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : exams.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-16 text-center">
          <GraduationCap size={40} className="text-muted-foreground opacity-50" aria-hidden />
          <p className="text-muted-foreground">No exams recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary font-medium text-secondary-foreground">
                <tr>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Grade</th>
                  <th className="px-6 py-3">Batch</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Results</th>
                  <th className="px-6 py-3">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {exams.map((exam) => (
                  <tr
                    key={exam.key}
                    onClick={() => setActiveExam(exam)}
                    className="cursor-pointer transition-colors duration-200 hover:bg-muted"
                  >
                    <td className="px-6 py-2.5 font-semibold text-foreground">{exam.subject}</td>
                    <td className="px-6 py-2.5 text-muted-foreground">Grade {exam.grade}</td>
                    <td className="px-6 py-2.5 text-muted-foreground">{exam.batchName}</td>
                    <td className="px-6 py-2.5 text-muted-foreground">
                      {new Date(exam.examDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-2.5 text-muted-foreground">{exam.results.length}</td>
                    <td className="px-6 py-2.5">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                        {exam.averagePercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isUploadOpen && (
        <NewExamModal
          batches={batches}
          onClose={() => setIsUploadOpen(false)}
          onUploaded={() => {
            setIsUploadOpen(false);
            fetchData();
          }}
        />
      )}

      {activeExam && <ExamResultsModal exam={activeExam} onClose={() => setActiveExam(null)} />}
    </div>
  );
}

function ExamResultsModal({ exam, onClose }: { exam: Exam; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{exam.subject}</h2>
            <p className="text-sm text-muted-foreground">
              Grade {exam.grade} · {exam.batchName} · {new Date(exam.examDate).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="cursor-pointer text-muted-foreground hover:text-foreground">
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="max-h-96 space-y-1 overflow-y-auto">
          {exam.results
            .slice()
            .sort((a, b) => b.marks / b.maxMarks - a.marks / a.maxMarks)
            .map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between rounded-lg px-3 py-2 odd:bg-muted/50"
              >
                <span className="font-medium text-foreground">{r.studentId?.name ?? "Unknown student"}</span>
                <span className="tabular text-muted-foreground">
                  {r.marks} / {r.maxMarks} ({Math.round((r.marks / r.maxMarks) * 100)}%)
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function NewExamModal({
  batches,
  onClose,
  onUploaded,
}: {
  batches: any[];
  onClose: () => void;
  onUploaded: () => void;
}) {
  const gradeBatches = (grade: string) => batches.filter((b) => b.grades?.includes(Number(grade)));

  const [grade, setGrade] = useState("3");
  const [batchId, setBatchId] = useState(gradeBatches("3")[0]?._id ?? "");
  const [subject, setSubject] = useState("");
  const [maxMarks, setMaxMarks] = useState(100);
  const [examDate, setExamDate] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGradeChange = (g: string) => {
    setGrade(g);
    setBatchId(gradeBatches(g)[0]?._id ?? "");
  };

  const handleDownloadTemplate = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ grade });
      if (batchId) params.set("batchId", batchId);
      const res = await fetch(`/api/students?${params}`);
      const data = await res.json();
      const students = data.students || [];

      const templateData = students.map((s: any) => ({
        "Student ID": s._id,
        "Name": s.name,
        "Marks (Required)": 0,
      }));

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Marks Template");
      XLSX.writeFile(wb, `KCSC_Grade${grade}_Template.xlsx`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !subject || !examDate) {
      alert("Please ensure Subject and Date are inputted before uploading.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const wb = XLSX.read(event.target?.result, { type: "binary" });
        const wsData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        const payload = wsData.map((row: any) => ({
          studentId: row["Student ID"],
          subject,
          examDate,
          marks: Number(row["Marks (Required)"]),
          maxMarks,
          grade: Number(grade),
          batchId: batchId || undefined,
        }));

        const res = await fetch("/api/marks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          onUploaded();
        } else {
          const err = await res.json();
          alert("Failed to upload marks: " + err.error);
        }
      } catch (err) {
        console.error(err);
        alert("Execution error reading Excel file.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-xl font-bold text-foreground">New Exam</h2>
          <button onClick={onClose} className="cursor-pointer text-muted-foreground hover:text-foreground">
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="mb-8 grid gap-4 rounded-2xl border border-border bg-muted/40 p-6 sm:grid-cols-2">
          <div>
            <label className="field-label">Target Grade</label>
            <select className="field cursor-pointer" value={grade} onChange={(e) => handleGradeChange(e.target.value)}>
              <option value="3">Grade 3</option>
              <option value="4">Grade 4</option>
              <option value="5">Grade 5</option>
            </select>
          </div>
          <div>
            <label className="field-label">Batch</label>
            <select className="field cursor-pointer" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
              {gradeBatches(grade).length === 0 && <option value="">No batches for this grade</option>}
              {gradeBatches(grade).map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Exam Date</label>
            <input
              type="date"
              required
              className="field"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Subject</label>
            <input
              type="text"
              placeholder="e.g. Mathematics"
              className="field"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Maximum Marks</label>
            <input
              type="number"
              min="1"
              className="field"
              value={maxMarks}
              onChange={(e) => setMaxMarks(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            onClick={handleDownloadTemplate}
            disabled={loading}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-primary py-4 font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Download size={20} /> 1. Download Template</>}
          </button>

          <div className="relative flex-1">
            <input
              type="file"
              accept=".xlsx, .xls"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={loading || !subject || !examDate}
            />
            <div
              className={`flex h-full w-full items-center justify-center gap-2 rounded-xl py-4 font-bold transition-colors ${
                !subject || !examDate
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Upload size={20} /> 2. Upload Filled Template</>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
