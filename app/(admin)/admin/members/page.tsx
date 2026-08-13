"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, UserCog, Plus, ShieldAlert } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";

type Member = {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  interest?: string;
  photoUrl?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<Member["status"], string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

export default function MembersListPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    if (user?.role !== "admin") return;
    setLoading(true);
    fetch(`/api/members${filter ? `?status=${filter}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setMembers(d.members ?? []);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter, user]);

  if (!userLoading && user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-16 text-center">
        <ShieldAlert size={40} className="text-muted-foreground opacity-50" aria-hidden />
        <p className="text-muted-foreground">
          Club membership is managed by admins only. Your account doesn&apos;t have access to this
          section.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl text-foreground">Club Members</h1>
          <p className="text-muted-foreground">
            Applications submitted from the club website, plus anyone added here directly.
          </p>
        </div>
        <Link
          href="/admin/members/new"
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
        >
          <Plus size={18} aria-hidden /> Add member
        </Link>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-16 text-center">
          <UserCog size={40} className="text-muted-foreground opacity-50" aria-hidden />
          <p className="text-muted-foreground">No {filter || ""} members to show.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary font-medium text-secondary-foreground">
                <tr>
                  <th className="px-6 py-3"></th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Interest</th>
                  <th className="px-6 py-3">Applied</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => (
                  <tr
                    key={m._id}
                    className="cursor-pointer transition-colors duration-200 hover:bg-muted"
                    onClick={() => (window.location.href = `/admin/members/${m._id}`)}
                  >
                    <td className="px-6 py-2.5">
                      {m.photoUrl ? (
                        <Image src={m.photoUrl} alt="" width={32} height={32} className="size-8 rounded-full object-cover" />
                      ) : (
                        <div className="size-8 rounded-full bg-muted" />
                      )}
                    </td>
                    <td className="px-6 py-2.5 font-semibold text-foreground">{m.fullName}</td>
                    <td className="px-6 py-2.5 text-muted-foreground">{m.phone}</td>
                    <td className="px-6 py-2.5 text-muted-foreground">{m.interest || "—"}</td>
                    <td className="px-6 py-2.5 text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLES[m.status]}`}
                      >
                        {m.status}
                      </span>
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
