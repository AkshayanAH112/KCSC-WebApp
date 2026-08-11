"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Search } from "lucide-react";

export default function ClassAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchClassData = useCallback(async () => {
    try {
      const res = await fetch(`/api/classes/${classId}`);
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  const toggleAttendance = async (studentId: string, currentPresent: boolean) => {
    const isPresent = !currentPresent;

    // Optimistic UI update
    setData((prev: any) => ({
      ...prev,
      roster: prev.roster.map((r: any) =>
        r.student._id === studentId ? { ...r, isPresent, isRecorded: true } : r
      ),
    }));

    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, classId, present: isPresent }),
      });
    } catch (e) {
      console.error("Failed to update attendance", e);
      fetchClassData(); // Revert on failure
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  if (!data?.classSession)
    return <div className="p-12 text-center text-muted-foreground">Class not found</div>;

  const { classSession, roster } = data;

  const filteredRoster = roster.filter((r: any) =>
    r.student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = roster.filter((r: any) => r.isPresent).length;
  const absentCount = roster.length - presentCount;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="flex cursor-pointer items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft size={20} aria-hidden /> Back
      </button>

      <div className="flex flex-col justify-between gap-6 rounded-lg border border-border bg-card p-6 shadow-xs md:flex-row md:items-center md:p-8">
        <div>
          <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            Grade {classSession.grade}
          </span>
          <h1 className="text-2xl text-foreground md:text-3xl">
            {classSession.subject || "General Session"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {new Date(classSession.date).toDateString()} at {classSession.time || "N/A"}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex min-w-25 flex-col items-center justify-center rounded-lg bg-success/10 p-4">
            <span className="tabular text-2xl font-bold text-success">
              {presentCount}
              <span className="text-sm font-normal text-success/70">/{roster.length}</span>
            </span>
            <span className="mt-1 text-xs font-bold uppercase text-success">Present</span>
          </div>
          <div className="flex min-w-25 flex-col items-center justify-center rounded-lg bg-muted p-4">
            <span className="tabular text-2xl font-bold text-muted-foreground">{absentCount}</span>
            <span className="mt-1 text-xs font-bold uppercase text-muted-foreground">Absent</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
        <div className="relative border-b border-border p-4">
          <Search
            className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
            aria-hidden
          />
          <label htmlFor="roster-search" className="sr-only">
            Search roster
          </label>
          <input
            id="roster-search"
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
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3 text-center">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRoster.map((r: any) => (
                <tr key={r.student._id} className="transition-colors duration-200 hover:bg-muted">
                  <td className="px-6 py-2.5 font-semibold text-foreground">{r.student.name}</td>
                  <td className="px-6 py-2.5 font-mono text-xs text-muted-foreground">
                    {r.student.qrCode}
                  </td>
                  <td className="px-6 py-2.5 text-center">
                    <button
                      onClick={() => toggleAttendance(r.student._id, r.isPresent)}
                      aria-pressed={r.isPresent}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 font-bold transition-all duration-200 ${
                        r.isPresent
                          ? "bg-success text-success-foreground shadow-xs"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {r.isPresent ? (
                        <CheckCircle2 size={18} aria-hidden />
                      ) : (
                        <XCircle size={18} aria-hidden />
                      )}
                      {r.isPresent ? "Present" : "Absent"}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRoster.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-muted-foreground">
                    No students found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
