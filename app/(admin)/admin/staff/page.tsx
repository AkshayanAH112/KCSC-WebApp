"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  ShieldCheck,
  ShieldAlert,
  UserX,
  UserCheck,
  Trash2,
  X,
} from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Staff = {
  _id: string;
  email: string;
  role: "admin" | "lms_manager";
  isActive: boolean;
  createdAt: string;
};

const ROLE_LABEL: Record<Staff["role"], string> = {
  admin: "Admin",
  lms_manager: "LMS Manager",
};

export default function StaffPage() {
  const { user: me, loading: userLoading } = useCurrentUser();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "lms_manager" as Staff["role"] });

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff");
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setStaff(d.staff ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (me?.role === "admin") fetchStaff();
  }, [me, fetchStaff]);

  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setForm({ email: "", password: "", role: "lms_manager" });
      setFormOpen(false);
      fetchStaff();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: Staff) => {
    setError(null);
    try {
      const res = await fetch(`/api/staff/${s._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      fetchStaff();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const [removeTarget, setRemoveTarget] = useState<Staff | null>(null);

  const remove = async (s: Staff) => {
    setRemoveTarget(null);
    setError(null);
    try {
      const res = await fetch(`/api/staff/${s._id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      fetchStaff();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!userLoading && me?.role !== "admin") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-16 text-center">
        <ShieldAlert size={40} className="text-muted-foreground opacity-50" aria-hidden />
        <p className="text-muted-foreground">Staff accounts are managed by admins only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl text-foreground">Staff Accounts</h1>
          <p className="text-muted-foreground">
            <strong>Admin</strong> manages the LMS and club members. <strong>LMS Manager</strong>{" "}
            manages the LMS only — no access to club members.
          </p>
        </div>
        <button
          onClick={() => setFormOpen((o) => !o)}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
        >
          {formOpen ? <X size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
          {formOpen ? "Cancel" : "New staff account"}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {formOpen && (
        <form onSubmit={createStaff} className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-xs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="staffEmail" className="field-label">Email</label>
              <input
                id="staffEmail"
                type="email"
                required
                className="field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="staffPassword" className="field-label">Password</label>
              <input
                id="staffPassword"
                type="password"
                required
                minLength={8}
                className="field"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="staffRole" className="field-label">Role</label>
              <select
                id="staffRole"
                className="field cursor-pointer"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Staff["role"] })}
              >
                <option value="lms_manager">LMS Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" aria-hidden />}
            Create account
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary font-medium text-secondary-foreground">
                <tr>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staff.map((s) => (
                  <tr key={s._id} className="transition-colors duration-200 hover:bg-muted">
                    <td className="px-6 py-2.5 font-semibold text-foreground">
                      {s.email}
                      {s.email === me?.email && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>
                      )}
                    </td>
                    <td className="px-6 py-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
                        <ShieldCheck size={12} aria-hidden /> {ROLE_LABEL[s.role]}
                      </span>
                    </td>
                    <td className="px-6 py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          s.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-6 py-2.5 text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-2.5">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleActive(s)}
                          title={s.isActive ? "Deactivate" : "Reactivate"}
                          className="cursor-pointer rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                        >
                          {s.isActive ? <UserX size={16} aria-hidden /> : <UserCheck size={16} aria-hidden />}
                        </button>
                        <button
                          onClick={() => setRemoveTarget(s)}
                          title="Delete account"
                          className="cursor-pointer rounded-lg p-2 text-destructive transition-colors duration-200 hover:bg-destructive/10"
                        >
                          <Trash2 size={16} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeTarget && remove(removeTarget)}
        title="Remove this staff account?"
        description={removeTarget ? `Remove ${removeTarget.email}'s account? They will no longer be able to sign in.` : undefined}
        confirmLabel="Remove"
        tone="danger"
      />
    </div>
  );
}
