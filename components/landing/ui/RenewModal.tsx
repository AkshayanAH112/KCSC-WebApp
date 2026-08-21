"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "./Button";
import { JOB_CATEGORIES, CLUB_BANK_DETAILS, FEE_CURRENCY } from "@/lib/membership";

export default function RenewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobCategory, setJobCategory] = useState<string>(JOB_CATEGORIES[0].value);
  const [jobOther, setJobOther] = useState("");

  const fee = JOB_CATEGORIES.find((c) => c.value === jobCategory)?.fee ?? 0;

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-renew-modal", handleOpen);
    return () => window.removeEventListener("open-renew-modal", handleOpen);
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const paymentSlip = form.get("paymentSlip");

    if (jobCategory === "other" && !jobOther.trim()) {
      setError("Please describe your occupation.");
      return;
    }
    if (!(paymentSlip instanceof File) || paymentSlip.size === 0) {
      setError("Please upload your bank transfer slip.");
      return;
    }

    const payload = new FormData();
    payload.set("phone", String(form.get("phone") ?? "").trim());
    payload.set("nic", String(form.get("nic") ?? "").trim());
    payload.set("jobCategory", jobCategory);
    if (jobCategory === "other") payload.set("jobOther", jobOther.trim());
    payload.set("paymentSlip", paymentSlip);

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/public/members/renew", {
        method: "POST",
        body: payload,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");

      setIsSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg bg-surface border border-outline-variant rounded-2xl shadow-elevated overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface bg-surface-container rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        {isSubmitted ? (
          <div className="p-12 flex flex-col items-center text-center space-y-4">
            <CheckCircle2 size={64} className="text-primary" />
            <h3 className="text-2xl font-display font-bold text-on-surface">Renewal Submitted!</h3>
            <p className="text-on-surface-variant">
              The club will verify your payment and confirm your renewed membership shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-display font-bold text-on-surface">Renew Membership</h3>
              <p className="text-sm text-on-surface-variant">
                Already a member? Confirm your details and submit a new payment to renew for another year.
              </p>
            </div>

            <fieldset className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">Phone Number</label>
                <input name="phone" required type="tel" pattern="^\+?[0-9]{7,15}$" title="Digits only, with an optional leading +" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="e.g. +94771234567" />
                <p className="text-xs text-on-surface-variant">The phone number on your existing membership.</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">NIC Number (if you have one on file)</label>
                <input name="nic" type="text" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="e.g. 123456789V" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">Occupation</label>
                <select
                  value={jobCategory}
                  onChange={(e) => setJobCategory(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface appearance-none"
                >
                  {JOB_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              {jobCategory === "other" && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">Please specify your occupation</label>
                  <input
                    type="text"
                    required
                    value={jobOther}
                    onChange={(e) => setJobOther(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
                    placeholder="e.g. Teacher, Engineer, Business Owner"
                  />
                </div>
              )}
            </fieldset>

            <fieldset className="space-y-4">
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 space-y-2">
                <p className="text-sm text-on-surface">
                  Annual renewal fee for <strong>{JOB_CATEGORIES.find((c) => c.value === jobCategory)?.label}</strong>:{" "}
                  <span className="font-bold text-primary">{FEE_CURRENCY} {fee}</span>
                </p>
                <p className="text-xs text-on-surface-variant">Pay by bank transfer to:</p>
                <dl className="text-xs text-on-surface grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                  <dt className="font-medium text-on-surface-variant">Account Name</dt>
                  <dd>{CLUB_BANK_DETAILS.accountName}</dd>
                  <dt className="font-medium text-on-surface-variant">Bank</dt>
                  <dd>{CLUB_BANK_DETAILS.bankName}</dd>
                  <dt className="font-medium text-on-surface-variant">Branch</dt>
                  <dd>{CLUB_BANK_DETAILS.branch}</dd>
                  <dt className="font-medium text-on-surface-variant">Account Number</dt>
                  <dd>{CLUB_BANK_DETAILS.accountNumber}</dd>
                </dl>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">Payment Slip</label>
                <input
                  name="paymentSlip"
                  required
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-on-primary"
                />
              </div>
            </fieldset>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Submitting…" : "Submit Renewal"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
