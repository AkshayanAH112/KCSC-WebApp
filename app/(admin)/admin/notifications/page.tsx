"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

type NotificationStatus = "pending" | "acknowledged" | "resolved";

const TABS: { key: NotificationStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "acknowledged", label: "Acknowledged" },
  { key: "resolved", label: "Resolved" },
];

export default function NotificationsPage() {
  const [tab, setTab] = useState<NotificationStatus>("pending");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (status: NotificationStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?status=${status}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(tab);
  }, [tab]);

  const updateStatus = async (id: string, status: NotificationStatus) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchData(tab);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance Notifications</h1>
        <p className="text-muted-foreground">Parent-warning and administrative alerts from the leave-tracking system.</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-16 text-center">
          <CheckCircle2 size={40} className="text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No {tab} notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n._id} className="rounded-lg border border-border bg-card p-5 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 rounded-lg p-2 ${n.type === "admin_critical" ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"}`}>
                    {n.type === "admin_critical" ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      {n.type === "admin_critical" ? "Administrative action required" : "Parent notification required"}
                    </p>
                    <Link href={`/admin/students/${n.studentId}`} className="text-sm text-primary hover:underline">
                      {n.registrationNumber} — {n.studentName}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Reached {n.leaveCount} leaves. Dates: {(n.leaveDates || []).map((d: string) => new Date(d).toLocaleDateString()).join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {n.status === "pending" && (
                    <button
                      onClick={() => updateStatus(n._id, "acknowledged")}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  {n.status !== "resolved" && (
                    <button
                      onClick={() => updateStatus(n._id, "resolved")}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
