"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  GraduationCap,
  AlertTriangle,
  QrCode,
  Newspaper,
  UserCog,
  ArrowRight,
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
    href: "/admin/scanner",
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
];

const quickLinks = [
  { href: "/admin/scanner", label: "Scan attendance", icon: QrCode, desc: "Check students in for today's session" },
  { href: "/admin/marks", label: "Enter marks", icon: GraduationCap, desc: "Record and analyse exam results" },
  { href: "/admin/news", label: "Publish news", icon: Newspaper, desc: "Add a post to the club website" },
];

export default function DashboardPage() {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        {cards.map(({ key, title, href, icon: Icon, tone, bg, hint }) => (
          <Link
            key={key}
            href={href}
            className="card-gold-rule cursor-pointer p-5 shadow-xs transition-colors duration-200 hover:border-gold hover:bg-accent/40"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
              <span className={`rounded-lg p-2 ${bg}`}>
                <Icon size={18} className={tone} aria-hidden />
              </span>
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
                      : String(stats[key])}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{stats ? hint(stats) : ""}</p>
              </>
            )}
          </Link>
        ))}
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
