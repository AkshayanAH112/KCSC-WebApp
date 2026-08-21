"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Loader2, Save, Upload } from "lucide-react";
import { JOB_CATEGORIES } from "@/lib/membership";

export default function NewMemberPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    address: "",
    nic: "",
    memberType: "Playing Member",
    jobCategory: JOB_CATEGORIES[0].value as string,
    jobOther: "",
    guardianName: "",
    guardianPhone: "",
    interest: "",
    photoUrl: "",
    photoPublicId: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "members");
      const res = await fetch("/api/upload", { method: "POST", body });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Upload failed");
      setForm((f) => ({ ...f, photoUrl: d.url, photoPublicId: d.publicId }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

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
    <div className="mx-auto max-w-2xl space-y-6">
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

      <form onSubmit={submit} className="space-y-8 rounded-lg border border-border bg-card p-6 shadow-xs sm:p-8">
        {/* SECTION: Personal Details */}
        <fieldset className="space-y-4">
          <legend className="mb-2 w-full border-b border-border pb-2 text-lg font-semibold text-primary">
            Personal Details
          </legend>

          <div>
            <label className="field-label">Photo</label>
            <div className="flex items-start gap-4">
              {form.photoUrl ? (
                <Image src={form.photoUrl} alt="" width={64} height={64} className="size-16 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
                  <Upload size={20} aria-hidden />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="field cursor-pointer text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary-foreground"
                />
                {uploadingPhoto && <Loader2 size={18} className="animate-spin text-muted-foreground shrink-0" aria-hidden />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="field-label">Full name</label>
              <input id="fullName" required className="field" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
            </div>
            <div>
              <label htmlFor="dob" className="field-label">Date of birth</label>
              <input id="dob" type="date" max={new Date().toISOString().slice(0, 10)} className="field" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </div>
            <div>
              <label htmlFor="nic" className="field-label">NIC number</label>
              <input id="nic" className="field" value={form.nic} onChange={(e) => set("nic", e.target.value)} />
            </div>
          </div>
        </fieldset>

        {/* SECTION: Contact Information */}
        <fieldset className="space-y-4">
          <legend className="mb-2 w-full border-b border-border pb-2 text-lg font-semibold text-primary">
            Contact Information
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="field-label">Phone</label>
              <input id="phone" type="tel" required pattern="^\+?[0-9]{7,15}$" title="Digits only, with an optional leading +" placeholder="e.g. +94771234567" className="field" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div>
              <label htmlFor="email" className="field-label">Email</label>
              <input id="email" type="email" className="field" value={form.email} onChange={(e) => set("email", e.target.value)} />
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
              <input id="guardianPhone" type="tel" pattern="^\+?[0-9]{7,15}$" title="Digits only, with an optional leading +" placeholder="e.g. +94771234567" className="field" value={form.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} />
            </div>
          </div>
        </fieldset>

        {/* SECTION: Club & Membership Details */}
        <fieldset className="space-y-4">
          <legend className="mb-2 w-full border-b border-border pb-2 text-lg font-semibold text-primary">
            Club & Membership Details
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="memberType" className="field-label">Member type</label>
              <select id="memberType" className="field cursor-pointer" value={form.memberType} onChange={(e) => set("memberType", e.target.value)}>
                <option value="Playing Member">Playing Member</option>
                <option value="Non-Playing Member">Non-Playing Member</option>
                <option value="Junior Member">Junior Member</option>
                <option value="Coach / Staff">Coach / Staff</option>
              </select>
            </div>
            <div>
              <label htmlFor="jobCategory" className="field-label">Occupation</label>
              <select id="jobCategory" className="field cursor-pointer" value={form.jobCategory} onChange={(e) => set("jobCategory", e.target.value)}>
                {JOB_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label} — LKR {c.fee}/yr</option>
                ))}
              </select>
            </div>
            {form.jobCategory === "other" && (
              <div>
                <label htmlFor="jobOther" className="field-label">Specify occupation</label>
                <input id="jobOther" className="field" value={form.jobOther} onChange={(e) => set("jobOther", e.target.value)} />
              </div>
            )}
            <div className="sm:col-span-2">
              <label htmlFor="interest" className="field-label">Sport / activity interest</label>
              <input id="interest" className="field" placeholder="e.g. Cricket" value={form.interest} onChange={(e) => set("interest", e.target.value)} />
            </div>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={saving || uploadingPhoto}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Save size={16} aria-hidden />}
          Add member
        </button>
      </form>
    </div>
  );
}
