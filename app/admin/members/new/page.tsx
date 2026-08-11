"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";

export default function NewMemberPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    address: "",
    guardianName: "",
    guardianPhone: "",
    interest: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      router.push(`/admin/members/${d.member._id}`);
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <button
        onClick={() => router.push("/admin/members")}
        className="flex cursor-pointer items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft size={20} aria-hidden /> Back to members
      </button>

      <div>
        <h1 className="text-3xl text-foreground">Add member</h1>
        <p className="text-muted-foreground">
          For a walk-in signup. This is added as <strong>approved</strong> immediately — for a public
          web application awaiting review, they should use the club website's membership form
          instead.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fullName" className="field-label">Full name</label>
            <input id="fullName" required className="field" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </div>
          <div>
            <label htmlFor="phone" className="field-label">Phone</label>
            <input id="phone" required className="field" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <label htmlFor="email" className="field-label">Email</label>
            <input id="email" type="email" className="field" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label htmlFor="dob" className="field-label">Date of birth</label>
            <input id="dob" type="date" className="field" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className="field-label">Address</label>
            <input id="address" className="field" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <label htmlFor="guardianName" className="field-label">Guardian name (if a minor)</label>
            <input id="guardianName" className="field" value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} />
          </div>
          <div>
            <label htmlFor="guardianPhone" className="field-label">Guardian phone</label>
            <input id="guardianPhone" className="field" value={form.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="interest" className="field-label">Sport / activity interest</label>
            <input id="interest" className="field" placeholder="e.g. Cricket" value={form.interest} onChange={(e) => set("interest", e.target.value)} />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Save size={16} aria-hidden />}
          Add member
        </button>
      </form>
    </div>
  );
}
