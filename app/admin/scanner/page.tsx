"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Loader2, AlertTriangle, Search, Save, CheckCircle2 } from "lucide-react";

/** Attendance rate under this flags the student at check-in. Mirrors lib/attendanceStats.ts. */
const LOW_ATTENDANCE_PERCENT = 75;

export default function ScannerPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [scannedStudent, setScannedStudent] = useState<any>(null);
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [attendedCount, setAttendedCount] = useState(0);
  const [recordedCount, setRecordedCount] = useState(0);
  const [message, setMessage] = useState<{ text: string; kind: "error" | "success" } | null>(null);

  const [isPresent, setIsPresent] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Manual fallback via ID
  const [manualCode, setManualCode] = useState("");
  const lastScannedCode = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((d) => {
        setClasses(d.classes || []);
        if (d.classes?.length > 0) setSelectedClass(d.classes[0]._id);
      });
  }, []);

  const handleQrScan = useCallback(
    async (qrCode: string) => {
      if (lastScannedCode.current === qrCode) return;
      lastScannedCode.current = qrCode;

      setScannedStudent(null);
      setMessage(null);
      try {
        const res = await fetch(`/api/students/lookup?qrCode=${qrCode}&classId=${selectedClass}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setScannedStudent(data.student);
        setAttendanceRate(data.attendanceRate);
        setAttendedCount(data.attendedCount ?? 0);
        setRecordedCount(data.recordedCount ?? 0);
        setIsPresent(true); // Default to present on scan
      } catch (e: any) {
        setMessage({ text: e.message, kind: "error" });
      }
    },
    [selectedClass]
  );

  useEffect(() => {
    if (!selectedClass) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        handleQrScan(decodedText);
      },
      (_error) => {
        /* ignore normal errors */
      }
    );

    return () => {
      scanner.clear().catch((e) => console.error(e));
    };
  }, [selectedClass, handleQrScan]);

  const submitAttendance = async () => {
    if (!scannedStudent || !selectedClass) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: scannedStudent._id,
          classId: selectedClass,
          present: isPresent,
        }),
      });
      if (res.ok) {
        setScannedStudent(null);
        lastScannedCode.current = null;
        setMessage({ text: "Attendance saved successfully.", kind: "success" });
        setTimeout(() => setMessage(null), 3000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isLowAttendance = attendanceRate !== null && attendanceRate < LOW_ATTENDANCE_PERCENT;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-xs">
        <h1 className="mb-4 text-2xl text-foreground">Scanner &amp; Attendance</h1>

        <div className="mb-2 flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="class-select" className="field-label">
              Active Class Session
            </label>
            <select
              id="class-select"
              className="field cursor-pointer"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="" disabled>
                Select a class...
              </option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  Grade {c.grade} - {c.subject || "Session"} (
                  {new Date(c.date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="manual-code" className="field-label">
              Manual Override
            </label>
            <div className="flex gap-2">
              <input
                id="manual-code"
                type="text"
                className="field"
                placeholder="Enter QR data manually"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQrScan(manualCode)}
              />
              <button
                onClick={() => handleQrScan(manualCode)}
                aria-label="Look up student by code"
                className="cursor-pointer rounded-lg bg-secondary px-4 text-secondary-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
              >
                <Search size={20} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Camera scanner view */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-xs">
          <h3 className="mb-4 font-bold text-foreground">Live Camera Feed</h3>
          {/* html5-qrcode injects its own unstyled controls; theme them to the club palette. */}
          <style>{`
            #qr-reader button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 8px 18px;
              border-radius: 10px;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              border: none;
              transition: background 0.2s, transform 0.1s;
            }
            #qr-reader button:active { transform: scale(0.97); }
            #qr-reader__scan_region + #qr-reader__dashboard button,
            #qr-reader__dashboard_section_csr button,
            #qr-reader__dashboard_section_fsr button {
              background: var(--primary);
              color: var(--primary-foreground);
              margin: 4px 4px;
            }
            #qr-reader__dashboard_section_csr button:hover,
            #qr-reader__dashboard_section_fsr button:hover {
              background: var(--gold);
              color: var(--gold-foreground);
            }
            #qr-reader__status_span { font-size: 13px; color: var(--muted-foreground); }
            #qr-reader select {
              padding: 6px 10px;
              border-radius: 8px;
              border: 1px solid var(--input);
              font-size: 14px;
              margin: 4px 0;
            }
          `}</style>
          {!selectedClass ? (
            <div className="p-12 text-center text-muted-foreground">
              Please select a class session first.
            </div>
          ) : (
            <div id="qr-reader" className="w-full overflow-hidden rounded-lg border-none" />
          )}
        </div>

        {/* Student result card */}
        <div className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-xs">
          <h3 className="mb-4 font-bold text-foreground">Scanner Result</h3>

          {message && (
            <div
              role="status"
              className={`mb-4 flex items-center gap-2 rounded-lg p-4 ${
                message.kind === "success"
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {message.kind === "success" ? (
                <CheckCircle2 size={18} aria-hidden />
              ) : (
                <AlertTriangle size={18} aria-hidden />
              )}
              {message.text}
            </div>
          )}

          {!scannedStudent ? (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
              <Search size={48} className="mb-4 opacity-50" aria-hidden />
              <p>Scan a student card to begin</p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl text-foreground">{scannedStudent.name}</h2>
                  <p className="font-medium text-primary">Grade {scannedStudent.grade}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Guardian: {scannedStudent.guardianName} ({scannedStudent.guardianPhone})
                  </p>
                </div>
                {isLowAttendance && (
                  <div className="flex items-center gap-2 rounded-lg bg-warning/15 px-3 py-1.5 font-bold text-warning">
                    <AlertTriangle size={18} aria-hidden /> {attendanceRate}% attendance
                  </div>
                )}
              </div>

              {recordedCount > 0 && (
                <p className="mb-4 text-sm text-muted-foreground">
                  Attended{" "}
                  <span className="tabular font-semibold text-foreground">
                    {attendedCount} of {recordedCount}
                  </span>{" "}
                  recorded sessions.
                </p>
              )}

              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-4">
                  <span className="font-medium text-foreground">Mark present?</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <span className="sr-only">Mark present</span>
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={isPresent}
                      onChange={() => setIsPresent(!isPresent)}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-input after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-white after:transition-all after:content-[''] peer-checked:bg-success peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50"></div>
                  </label>
                </div>
              </div>

              <button
                onClick={submitAttendance}
                disabled={submitting}
                className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary py-4 font-bold text-primary-foreground shadow-xs transition-all duration-200 hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" aria-hidden />
                ) : (
                  <>
                    <Save size={24} aria-hidden /> Confirm &amp; Save
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
