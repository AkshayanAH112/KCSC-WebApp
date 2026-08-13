"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "./Button";

export default function JoinModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-join-modal", handleOpen);
    return () => window.removeEventListener("open-join-modal", handleOpen);
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
    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const photo = form.get("photo");

    const payload = new FormData();
    payload.set("fullName", [firstName, lastName].filter(Boolean).join(" "));
    payload.set("email", String(form.get("email") ?? "").trim());
    payload.set("phone", String(form.get("phone") ?? "").trim());
    payload.set("nic", String(form.get("nic") ?? "").trim());
    payload.set("address", String(form.get("address") ?? "").trim());
    payload.set("memberType", String(form.get("membershipType") ?? ""));
    payload.set("interest", String(form.get("role") ?? ""));
    payload.set("message", String(form.get("achievements") ?? "").trim());
    if (photo instanceof File && photo.size > 0) payload.set("photo", photo);

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/public/members", {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-xl bg-surface border border-outline-variant rounded-2xl shadow-elevated overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface bg-surface-container rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        {isSubmitted ? (
          <div className="p-12 flex flex-col items-center text-center space-y-4">
            <CheckCircle2 size={64} className="text-primary" />
            <h3 className="text-2xl font-display font-bold text-on-surface">Application Received!</h3>
            <p className="text-on-surface-variant">
              Welcome to the KCSC family. We&apos;ve sent the next steps to your email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">
            <div className="space-y-2">
              <h3 className="text-2xl font-display font-bold text-on-surface">Join The Club</h3>
              <p className="text-sm text-on-surface-variant">Fill out the details below to register your interest.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">First Name</label>
                  <input name="firstName" required type="text" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="John" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">Last Name</label>
                  <input name="lastName" required type="text" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">Email</label>
                <input name="email" required type="email" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="john@example.com" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">Phone Number</label>
                <input name="phone" required type="tel" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="+1 (555) 000-0000" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">Address</label>
                <input name="address" required type="text" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="123 Cricket Lane, City" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">NIC Number</label>
                <input name="nic" required type="text" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="e.g. 200012345678 or 851234567V" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">Photo</label>
                <input
                  name="photo"
                  required
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-on-primary"
                />
                <p className="text-xs text-on-surface-variant">Used for your membership card — a clear passport-style photo.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">Membership Type</label>
                  <select name="membershipType" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface appearance-none">
                    <option value="Playing Member">Playing Member</option>
                    <option value="Non-Playing Member">Non-Playing Member</option>
                    <option value="Junior Member">Junior Member</option>
                    <option value="Coach / Staff">Coach / Staff</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">Role</label>
                  <select name="role" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface appearance-none">
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-Rounder">All-Rounder</option>
                    <option value="Wicket Keeper">Wicket Keeper</option>
                    <option value="">Not Applicable</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">Sports Achievements</label>
                <textarea name="achievements" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface min-h-[100px]" placeholder="Tell us about your past clubs, highest scores, best bowling figures, or championships won..."></textarea>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
              {isSubmitting ? "Submitting…" : "Submit Application"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
