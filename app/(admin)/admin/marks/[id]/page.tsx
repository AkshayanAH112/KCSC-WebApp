"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Loader2, ArrowLeft, Search, Download, Upload, Pencil, Trash2, X } from "lucide-react";
import { ConfirmDialog, AlertModal } from "@/components/confirm-dialog";

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/exams/${examId}`);
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveOne = async (studentId: string) => {
    const value = entries[studentId];
    if (value === undefined || value === "") return;
    setSaving(true);
    try {
      await fetch(`/api/exams/${examId}/marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, marks: Number(value) }),
      });
      setEntries((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!data?.roster) return;
    const templateData = data.roster.map((r: any) => ({
      "Student ID": r.student._id,
      Name: r.student.name,
      "Marks (Required)": r.mark?.marks ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks Template");
    XLSX.writeFile(wb, `KCSC_${data.exam.subject}_Template.xlsx`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const wb = XLSX.read(event.target?.result, { type: "binary" });
        const wsData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        const payload = wsData.map((row: any) => ({
          studentId: row["Student ID"],
          marks: Number(row["Marks (Required)"]),
        }));
        const res = await fetch(`/api/exams/${examId}/marks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          fetchData();
        } else {
          const err = await res.json();
          setError("Failed to upload marks: " + err.error);
        }
      } catch (err) {
        console.error(err);
        setError("Error reading Excel file.");
      } finally {
        setSaving(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = async () => {
    setConfirmDeleteOpen(false);
    const res = await fetch(`/api/exams/${examId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/marks");
    } else {
      const err = await res.json();
      setError(err.error);
    }
  };
  const recordedForDeleteCount = data?.roster?.filter((r: any) => r.isRecorded).length ?? 0;

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!data?.exam) return <div className="p-12 text-center text-muted-foreground">Exam not found</div>;

  const { exam, roster } = data;
  const filteredRoster = roster.filter((r: any) => r.student.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const recordedCount = roster.filter((r: any) => r.isRecorded).length;

  return (
    <div className="space-y-6">
      <button onClick={() => router.push("/admin/marks")} className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft size={20} /> Back to Exams
      </button>

      <div className="flex flex-col justify-between gap-6 rounded-lg border border-border bg-card p-6 shadow-xs md:flex-row md:items-center md:p-8">
        <div>
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Grade {exam.grade}</span>
          <h1 className="text-2xl text-foreground md:text-3xl">{exam.name ? `${exam.subject} — ${exam.name}` : exam.subject}</h1>
          <p className="mt-1 text-muted-foreground">
            {exam.batchId?.name} · {new Date(exam.examDate).toLocaleDateString()} · Out of {exam.maxMarks}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-25 flex-col items-center justify-center rounded-lg bg-primary/10 p-4">
            <span className="tabular text-2xl font-bold text-primary">
              {recordedCount}
              <span className="text-sm font-normal text-primary/70">/{roster.length}</span>
            </span>
            <span className="mt-1 text-xs font-bold uppercase text-primary">Recorded</span>
          </div>
          <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 font-medium text-foreground transition-colors hover:bg-muted">
            <Pencil size={16} /> Edit
          </button>
          <button onClick={() => setConfirmDeleteOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 font-medium text-destructive transition-colors hover:bg-destructive/10">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4 sm:flex-row">
        <button
          onClick={handleDownloadTemplate}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-primary py-3 font-bold text-primary transition-colors hover:bg-primary/10"
        >
          <Download size={18} /> Download Excel Template
        </button>
        <div className="relative flex-1">
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={saving}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <div className="flex h-full w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <><Upload size={18} /> Upload Filled Template</>}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
        <div className="relative border-b border-border p-4">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search roster..."
            className="field pl-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary font-medium text-secondary-foreground">
              <tr>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3 text-right">Marks (out of {exam.maxMarks})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRoster.map((r: any) => (
                <tr key={r.student._id} className="transition-colors duration-200 hover:bg-muted">
                  <td className="px-6 py-2.5 font-semibold text-foreground">{r.student.name}</td>
                  <td className="px-6 py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      <input
                        type="number"
                        min={0}
                        max={exam.maxMarks}
                        className="field w-24 text-center"
                        placeholder={r.mark ? String(r.mark.marks) : "—"}
                        value={entries[r.student._id] ?? ""}
                        onChange={(e) => setEntries({ ...entries, [r.student._id]: e.target.value })}
                        onBlur={() => saveOne(r.student._id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                      />
                      {r.isRecorded && entries[r.student._id] === undefined && (
                        <span className="text-xs font-bold text-success">Saved</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRoster.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-12 text-center text-muted-foreground">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditOpen && (
        <EditExamModal exam={exam} onClose={() => setIsEditOpen(false)} onSaved={() => { setIsEditOpen(false); fetchData(); }} />
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this exam?"
        description={`This will also delete its ${recordedForDeleteCount} recorded mark(s). This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
      />
      <AlertModal open={error !== null} onClose={() => setError(null)} title="Something went wrong" description={error ?? undefined} tone="danger" />
    </div>
  );
}

function EditExamModal({ exam, onClose, onSaved }: { exam: any; onClose: () => void; onSaved: () => void }) {
  const [subject, setSubject] = useState(exam.subject);
  const [name, setName] = useState(exam.name ?? "");
  const [maxMarks, setMaxMarks] = useState(exam.maxMarks);
  const [examDate, setExamDate] = useState(new Date(exam.examDate).toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/exams/${exam._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, name: name || undefined, maxMarks, examDate }),
      });
      if (res.ok) onSaved();
      else {
        const err = await res.json();
        setError(err.error);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-xl font-bold text-foreground">Edit Exam</h2>
          <button onClick={onClose} className="cursor-pointer text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="field-label">Subject</label>
            <input required className="field" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Label (optional)</label>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Exam Date</label>
              <input type="date" required className="field" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Max Marks</label>
              <input type="number" min="1" required className="field" value={maxMarks} onChange={(e) => setMaxMarks(Number(e.target.value))} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Changing Max Marks does not rescale marks already entered.</p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border bg-card py-2 font-medium text-foreground transition-colors hover:bg-muted">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-primary py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {saving ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Save"}
            </button>
          </div>
        </form>
      </div>
      <AlertModal open={error !== null} onClose={() => setError(null)} title="Failed to save" description={error ?? undefined} tone="danger" />
    </div>
  );
}
