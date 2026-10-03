"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  Users,
  CalendarCheck,
  GraduationCap,
  AlertTriangle,
  QrCode,
  Newspaper,
  UserCog,
  ArrowRight,
  ShieldAlert,
  UserX,
  Bell,
  Download,
  Loader2,
} from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";

interface Stats {
  totalStudents: number;
  todayAttendance: string;
  hasClassesToday: boolean;
  presentToday: number;
  expectedToday: number;
  absentToday: number;
  lowAttendanceCount: number;
  publishedPosts: number;
  pendingMembers: number | null;
  recentMarks: number;
  studentsOnLeaveToday: number;
  studentsAtCycle2: number;
  studentsAtCycle3: number;
  deactivatedStudents: number;
}

const statConfig = [
  {
    key: "totalStudents" as const,
    title: "Active Students",
    href: "/admin/students",
    icon: Users,
    tone: "text-primary",
    bg: "bg-primary/10",
    hint: (s: Stats) => `across all batches`,
  },
  {
    key: "todayAttendance" as const,
    title: "Today's Attendance",
    // Today's class list, each linking through to its roster — not straight to
    // the scanner, which can only check in one student at a time.
    href: "/admin/attendance/today",
    icon: CalendarCheck,
    tone: "text-success",
    bg: "bg-success/10",
    hint: (s: Stats) =>
      s.hasClassesToday ? `${s.presentToday} of ${s.expectedToday} present` : "no sessions scheduled",
  },
  {
    key: "lowAttendanceCount" as const,
    title: "Needs Follow-up",
    href: "/admin/analysis",
    icon: AlertTriangle,
    tone: "text-warning",
    bg: "bg-warning/10",
    hint: () => "below 75% attendance",
  },
  {
    key: "recentMarks" as const,
    title: "Marks Entered Today",
    href: "/admin/marks",
    icon: GraduationCap,
    tone: "text-gold-foreground",
    bg: "bg-gold/20",
    hint: () => "new result records",
  },
  {
    key: "studentsOnLeaveToday" as const,
    title: "On Leave Today",
    // Deep-links to the not-present table, not /admin/attendance — that page is
    // the date-range Excel export, which is not what this number is about.
    href: "/admin/attendance/today#absent",
    icon: CalendarCheck,
    tone: "text-warning",
    bg: "bg-warning/10",
    // This counts students *explicitly* marked absent, which is what a leave
    // is. Students nobody scanned are missing from the percentage above but
    // are not leaves, so the two numbers legitimately differ — the linked page
    // breaks the difference out.
    hint: () => "marked absent — counts as a leave",
  },
  {
    key: "studentsAtCycle2" as const,
    title: "At 2 Leaves",
    href: "/admin/notifications?type=parent_warning",
    icon: AlertTriangle,
    tone: "text-warning",
    bg: "bg-warning/10",
    hint: () => "parent notification pending",
  },
  {
    key: "studentsAtCycle3" as const,
    title: "At 3 Leaves",
    href: "/admin/notifications?type=admin_critical",
    icon: ShieldAlert,
    tone: "text-destructive",
    bg: "bg-destructive/10",
    hint: () => "admin action required",
  },
  {
    key: "deactivatedStudents" as const,
    title: "Deactivated",
    href: "/admin/students",
    icon: UserX,
    tone: "text-muted-foreground",
    bg: "bg-muted",
    hint: () => "not currently active",
  },
];

const quickLinks = [
  { href: "/admin/scanner", label: "Scan attendance", icon: QrCode, desc: "Check students in for today's session" },
  { href: "/admin/notifications", label: "Review notifications", icon: Bell, desc: "Parent-warning and admin-critical leave alerts" },
  { href: "/admin/marks", label: "Enter marks", icon: GraduationCap, desc: "Record and analyse exam results" },
  { href: "/admin/news", label: "Publish news", icon: Newspaper, desc: "Add a post to the club website" },
];

export default function DashboardPage() {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setStats(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadCard = async (key: "studentsAtCycle2" | "studentsAtCycle3", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isCycle2 = key === "studentsAtCycle2";
    const cycleParam = isCycle2 ? "2" : "3+";
    const title = isCycle2 ? "At_2_Leaves" : "At_3_Leaves";

    setDownloadingKey(key);
    try {
      const res = await fetch(`/api/students?cycle=${cycleParam}&isActive=true`);
      const data = await res.json();
      const studentsList = data.students || [];
      if (studentsList.length === 0) return;

      const header = [
        "Registration Number",
        "Student Name",
        "Batch",
        "Grade",
        "Current Leave Cycle",
        "Total Leaves (Lifetime)",
        "School",
        "Guardian Name",
        "Guardian Phone",
        "Address",
      ];

      const sheetRows = studentsList.map((s: any) => [
        s.registrationNumber || "—",
        s.name,
        s.batchId?.name || "—",
        s.grade ? `Grade ${s.grade}` : "—",
        s.currentLeaveCycle ?? 0,
        s.totalLeaves ?? 0,
        s.school || "—",
        s.guardianName || "—",
        s.guardianPhone || "—",
        s.address || "—",
      ]);

      const ws = XLSX.utils.aoa_to_sheet([header, ...sheetRows]);
      ws["!cols"] = [
        { wch: 18 },
        { wch: 25 },
        { wch: 18 },
        { wch: 12 },
        { wch: 20 },
        { wch: 22 },
        { wch: 25 },
        { wch: 22 },
        { wch: 18 },
        { wch: 30 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, isCycle2 ? "2 Leaves" : "3 Leaves");
      XLSX.writeFile(wb, `KCSC_Students_${title}.xlsx`);
    } catch (err) {
      console.error("Failed to download students list", err);
    } finally {
      setDownloadingKey(null);
    }
  };

  // pendingMembers only exists in the payload for an admin session — an
  // lms_manager gets `null` from the API and never sees this card.
  const cards =
    user?.role === "admin"
      ? [
          ...statConfig,
          {
            key: "pendingMembers" as const,
            title: "Pending Members",
            href: "/admin/members",
            icon: UserCog,
            tone: "text-primary",
            bg: "bg-primary/10",
            hint: () => "awaiting review",
          },
        ]
      : statConfig;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-foreground">Club Dashboard</h1>
        <p className="text-muted-foreground">
          Kallar Central Sports Club — free tuition programme at a glance.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          Failed to load stats: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ key, title, href, icon: Icon, tone, bg, hint }) => {
          const isDownloadable = key === "studentsAtCycle2" || key === "studentsAtCycle3";
          const count = stats ? Number(stats[key as keyof Stats] ?? 0) : 0;

          return (
            <Link
              key={key}
              href={href}
              className="card-gold-rule group cursor-pointer p-5 shadow-xs transition-colors duration-200 hover:border-gold hover:bg-accent/40"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                <div className="flex items-center gap-1.5">
                  {isDownloadable && (
                    <button
                      onClick={(e) => handleDownloadCard(key as "studentsAtCycle2" | "studentsAtCycle3", e)}
                      disabled={downloadingKey === key || count === 0}
                      className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                      title={count === 0 ? "No students at this leave count" : `Download ${title} student list as Excel`}
                      aria-label={`Download ${title} list`}
                    >
                      {downloadingKey === key ? (
                        <Loader2 size={16} className="animate-spin text-primary" />
                      ) : (
                        <Download size={16} />
                      )}
                    </button>
                  )}
                  <span className={`rounded-lg p-2 ${bg}`}>
                    <Icon size={18} className={tone} aria-hidden />
                  </span>
                </div>
              </div>
              {loading ? (
                <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
              ) : (
                <>
                  <p className="tabular text-3xl font-bold text-foreground">
                    {!stats
                      ? "—"
                      : key === "todayAttendance" && !stats.hasClassesToday
                        ? "—"
                        : String(stats[key as keyof Stats])}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{stats ? hint(stats) : ""}</p>
                </>
              )}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(user?.role === "admin"
          ? [
              ...quickLinks,
              {
                href: "/admin/members",
                label: "Review members",
                icon: UserCog,
                desc: "Approve or reject club membership applications",
              },
            ]
          : quickLinks
        ).map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="group flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-5 transition-colors duration-200 hover:border-gold hover:bg-accent/40"
          >
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <Icon size={18} aria-hidden />
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                {label}
                <ArrowRight
                  size={14}
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
