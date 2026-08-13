"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertTriangle,
  UserRound,
  Download,
  Mail,
} from "lucide-react";
import { MembershipCardFront, MembershipCardBack } from "@/components/membership-card";

type Member = {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  nic?: string;
  memberType?: string;
  memberCode?: string;
  photoUrl?: string;
  guardianName?: string;
  guardianPhone?: string;
  interest?: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  reviewNotes?: string;
  reviewedBy?: { email: string } | null;
  reviewedAt?: string;
  createdAt: string;
};

const STATUS_STYLES: Record<Member["status"], string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const frontCardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  const [autoSendPending, setAutoSendPending] = useState(false);
  const [emailState, setEmailState] = useState<{ sending: boolean; error: string | null; sentAt: string | null }>({
    sending: false,
    error: null,
    sentAt: null,
  });

  const fetchMember = useCallback(async () => {
    try {
      const res = await fetch(`/api/members/${id}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMember(d.member);
      setNotes(d.member.reviewNotes ?? "");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  const setStatus = async (status: Member["status"]) => {
    const wasApproved = member?.status === "approved";
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNotes: notes }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMember(d.member);
      // Just-approved — the card section below is about to mount for the first
      // time; the effect watching autoSendPending waits for that before sending.
      if (status === "approved" && !wasApproved) setAutoSendPending(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const captureCards = async () => {
    if (!frontCardRef.current || !backCardRef.current) return null;
    const html2canvas = (await import("html2canvas-pro")).default;
    const [front, back] = await Promise.all([
      html2canvas(frontCardRef.current, { scale: 4, useCORS: true, backgroundColor: "#ffffff" }),
      html2canvas(backCardRef.current, { scale: 4, useCORS: true, backgroundColor: "#ffffff" }),
    ]);
    return { front: front.toDataURL("image/png"), back: back.toDataURL("image/png") };
  };

  const downloadCard = async (face: "front" | "back") => {
    const html2canvas = (await import("html2canvas-pro")).default;
    const node = face === "front" ? frontCardRef.current : backCardRef.current;
    if (!node || !member) return;
    const canvas = await html2canvas(node, { scale: 4, useCORS: true, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = `${member.fullName.replace(/\s+/g, "_")}_Membership_Card_${face}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const sendCardEmail = useCallback(async () => {
    if (!member) return;
    if (!member.email) {
      setEmailState({ sending: false, error: "This member has no email address on file.", sentAt: null });
      return;
    }
    setEmailState({ sending: true, error: null, sentAt: null });
    try {
      const images = await captureCards();
      if (!images) throw new Error("Could not render the membership card yet — try again in a moment.");
      const res = await fetch(`/api/members/${id}/send-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(images),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setEmailState({ sending: false, error: null, sentAt: new Date().toISOString() });
    } catch (e: any) {
      setEmailState({ sending: false, error: e.message, sentAt: null });
    }
  }, [member, id]);

  // Fires once, right after an approval — waits for the card faces below to
  // actually mount (refs only populate post-render) plus a short buffer for the
  // photo/template images inside them to finish loading before capture.
  useEffect(() => {
    if (!autoSendPending || member?.status !== "approved") return;
    if (!frontCardRef.current || !backCardRef.current) return;
    setAutoSendPending(false);
    const t = setTimeout(() => sendCardEmail(), 600);
    return () => clearTimeout(t);
  }, [autoSendPending, member, sendCardEmail]);

  const remove = async () => {
    if (!confirm(`Delete ${member?.fullName}'s application? This can't be undone.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push("/admin/members");
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  if (!member) return <div className="p-12 text-center text-muted-foreground">Member not found</div>;

  const rows: [string, string | undefined][] = [
    ["Phone", member.phone],
    ["Email", member.email],
    ["NIC", member.nic],
    ["Member type", member.memberType],
    ["Date of birth", member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : undefined],
    ["Address", member.address],
    ["Guardian", member.guardianName],
    ["Guardian phone", member.guardianPhone],
    ["Sport / interest", member.interest],
    ["Member ID", member.memberCode],
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/admin/members")}
        className="flex cursor-pointer items-center gap-2 text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft size={20} aria-hidden /> Back to members
      </button>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertTriangle size={18} aria-hidden /> {error}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {member.photoUrl ? (
            <Image src={member.photoUrl} alt="" width={64} height={64} className="size-16 rounded-lg object-cover" />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <UserRound size={28} aria-hidden />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl text-foreground">{member.fullName}</h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${STATUS_STYLES[member.status]}`}
              >
                {member.status}
              </span>
            </div>
            <p className="text-muted-foreground">
              Applied {new Date(member.createdAt).toLocaleDateString()}
              {member.reviewedBy && member.reviewedAt
                ? ` · Reviewed by ${member.reviewedBy.email} on ${new Date(member.reviewedAt).toLocaleDateString()}`
                : ""}
            </p>
          </div>
        </div>
        <button
          onClick={remove}
          disabled={saving}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 font-medium text-destructive transition-colors duration-200 hover:bg-destructive/10 disabled:opacity-60"
        >
          <Trash2 size={16} aria-hidden /> Delete
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 shadow-xs lg:col-span-2">
          <h2 className="mb-4 text-lg text-foreground">Application details</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rows
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-foreground">{value}</dd>
                </div>
              ))}
          </dl>
          {member.message && (
            <div className="mt-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Message
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-foreground">{member.message}</dd>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-xs">
          <div>
            <label htmlFor="notes" className="field-label">
              Review notes
            </label>
            <textarea
              id="notes"
              className="field min-h-24"
              placeholder="Optional — visible to admins only"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            onClick={() => setStatus("approved")}
            disabled={saving || member.status === "approved"}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-success py-2.5 font-semibold text-success-foreground transition-colors duration-200 hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={18} aria-hidden /> Approve
          </button>
          <button
            onClick={() => setStatus("rejected")}
            disabled={saving || member.status === "rejected"}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-destructive/30 py-2.5 font-semibold text-destructive transition-colors duration-200 hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XCircle size={18} aria-hidden /> Reject
          </button>
          {member.status !== "pending" && (
            <button
              onClick={() => setStatus("pending")}
              disabled={saving}
              className="w-full cursor-pointer rounded-lg py-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground disabled:opacity-50"
            >
              Reset to pending
            </button>
          )}
        </div>
      </div>

      {member.status === "approved" && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-xs">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg text-foreground">Membership card</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => downloadCard("front")}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted"
              >
                <Download size={14} aria-hidden /> Front
              </button>
              <button
                onClick={() => downloadCard("back")}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted"
              >
                <Download size={14} aria-hidden /> Back
              </button>
              <button
                onClick={sendCardEmail}
                disabled={emailState.sending}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {emailState.sending ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden />
                ) : (
                  <Mail size={14} aria-hidden />
                )}
                {emailState.sending ? "Sending…" : "Email card"}
              </button>
            </div>
          </div>

          {emailState.error && (
            <div
              role="alert"
              className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertTriangle size={16} aria-hidden /> {emailState.error}
            </div>
          )}
          {emailState.sentAt && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
              <CheckCircle2 size={16} aria-hidden /> Card emailed to {member.email} at{" "}
              {new Date(emailState.sentAt).toLocaleTimeString()}.
            </div>
          )}

          <div className="flex flex-wrap gap-6 overflow-x-auto">
            <MembershipCardFront member={member} cardRef={frontCardRef} />
            <MembershipCardBack cardRef={backCardRef} />
          </div>
        </div>
      )}
    </div>
  );
}
