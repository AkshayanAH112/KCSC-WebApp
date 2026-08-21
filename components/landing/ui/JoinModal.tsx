"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "./Button";
import { JOB_CATEGORIES, CLUB_BANK_DETAILS, FEE_CURRENCY, isNicRequired } from "@/lib/membership";

export default function JoinModal() {
  const t = useTranslations("JoinModal");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [age, setAge] = useState("");
  const [jobCategory, setJobCategory] = useState<string>(JOB_CATEGORIES[0].value);
  const [jobOther, setJobOther] = useState("");

  const nicRequired = isNicRequired(age === "" ? undefined : Number(age));
  const fee = JOB_CATEGORIES.find((c) => c.value === jobCategory)?.fee ?? 0;

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
    payload.set("fullName", [firstName, lastName].filter(Boolean).join(" "));
    payload.set("email", String(form.get("email") ?? "").trim());
    payload.set("phone", String(form.get("phone") ?? "").trim());
    payload.set("whatsapp", String(form.get("whatsapp") ?? "").trim());
    payload.set("nic", String(form.get("nic") ?? "").trim());
    payload.set("address", String(form.get("address") ?? "").trim());
    payload.set("dateOfBirth", String(form.get("dateOfBirth") ?? ""));
    payload.set("age", age);
    payload.set("gender", String(form.get("gender") ?? ""));
    payload.set("dateOfJoining", String(form.get("dateOfJoining") ?? ""));
    payload.set("previousClub", String(form.get("previousClub") ?? "").trim());
    payload.set("memberType", String(form.get("membershipType") ?? ""));
    payload.set("interest", String(form.get("role") ?? ""));
    payload.set("message", String(form.get("achievements") ?? "").trim());
    payload.set("jobCategory", jobCategory);
    if (jobCategory === "other") payload.set("jobOther", jobOther.trim());
    if (photo instanceof File && photo.size > 0) payload.set("photo", photo);
    payload.set("paymentSlip", paymentSlip);

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
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
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
            <h3 className="text-2xl font-display font-bold text-on-surface">{t("success_title")}</h3>
            <p className="text-on-surface-variant">
              {t("success_message")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-display font-bold text-on-surface">{t("title")}</h3>
              <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>
            </div>

            {/* SECTION: Personal Details */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-display font-semibold text-primary mb-2 border-b border-outline-variant pb-2 w-full">{t("section_personal")}</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">{t("first_name")}</label>
                  <input name="firstName" required type="text" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="John" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">{t("last_name")}</label>
                  <input name="lastName" required type="text" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="Doe" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">{t("dob")}</label>
                  <input name="dateOfBirth" type="date" required max={new Date().toISOString().slice(0, 10)} className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">{t("age")}</label>
                  <input
                    name="age"
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">
                    {t("nic")} {!nicRequired && <span className="text-on-surface-variant font-normal">{t("nic_optional")}</span>}
                  </label>
                  <input name="nic" type="text" required={nicRequired} className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="e.g. 123456789V" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">{t("gender")}</label>
                  <select name="gender" required defaultValue="" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface appearance-none">
                    <option value="" disabled>{t("gender_select")}</option>
                    <option value="Male">{t("gender_male")}</option>
                    <option value="Female">{t("gender_female")}</option>
                    <option value="Other">{t("gender_other")}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">{t("occupation")}</label>
                <select
                  value={jobCategory}
                  onChange={(e) => setJobCategory(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface appearance-none"
                >
                  {JOB_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{t(`job_${c.value}` as any)}</option>
                  ))}
                </select>
              </div>
              {jobCategory === "other" && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">{t("job_specify")}</label>
                  <input
                    type="text"
                    required
                    value={jobOther}
                    onChange={(e) => setJobOther(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
                    placeholder={t("job_specify_placeholder")}
                  />
                </div>
              )}
            </fieldset>

            {/* SECTION: Contact Information */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-display font-semibold text-primary mb-2 border-b border-outline-variant pb-2 w-full">{t("section_contact")}</legend>
              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">{t("email")}</label>
                <input name="email" required type="email" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="john@example.com" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">{t("address")}</label>
                <input name="address" required type="text" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="123 Cricket Lane, City" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">{t("photo")}</label>
                <input
                  name="photo"
                  required
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-on-primary"
                />
                <p className="text-xs text-on-surface-variant">{t("photo_desc")}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">{t("phone")}</label>
                  <input name="phone" required type="tel" pattern="^\+?[0-9]{7,15}$" title="Digits only, with an optional leading +" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="e.g. +94771234567" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">{t("whatsapp")}</label>
                  <input name="whatsapp" required type="tel" pattern="^\+?[0-9]{7,15}$" title="Digits only, with an optional leading +" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="e.g. +94771234567" />
                </div>
              </div>
            </fieldset>

            {/* SECTION: Membership Details */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-display font-semibold text-primary mb-2 border-b border-outline-variant pb-2 w-full">{t("section_membership")}</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">{t("membership_type")}</label>
                  <select name="membershipType" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface appearance-none">
                    <option value="Playing Member">{t("type_playing")}</option>
                    <option value="Non-Playing Member">{t("type_non_playing")}</option>
                    <option value="Junior Member">{t("type_junior")}</option>
                    <option value="Coach / Staff">{t("type_coach")}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">{t("role")}</label>
                  <select name="role" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface appearance-none">
                    <option value="Batsman">{t("role_batsman")}</option>
                    <option value="Bowler">{t("role_bowler")}</option>
                    <option value="All-Rounder">{t("role_allrounder")}</option>
                    <option value="Wicket Keeper">{t("role_wicketkeeper")}</option>
                    <option value="">{t("role_na")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">{t("prev_club")}</label>
                  <input name="previousClub" type="text" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" placeholder="e.g. Apex Cricket Club" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-on-surface">{t("date_join")}</label>
                  <input name="dateOfJoining" type="date" required className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">{t("achievements")}</label>
                <textarea name="achievements" className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface min-h-25" placeholder={t("achievements_placeholder")}></textarea>
              </div>
            </fieldset>

            {/* SECTION: Membership Fee & Payment */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-display font-semibold text-primary mb-2 border-b border-outline-variant pb-2 w-full">{t("section_payment")}</legend>

              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 space-y-2">
                <p className="text-sm text-on-surface">
                  {t("fee_annual")} <strong>{t(`job_${jobCategory}` as any)}</strong>:{" "}
                  <span className="font-bold text-primary">{FEE_CURRENCY} {fee}</span>
                </p>
                <p className="text-xs text-on-surface-variant">{t("pay_transfer")}</p>
                <dl className="text-xs text-on-surface grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                  <dt className="font-medium text-on-surface-variant">{t("acc_name")}</dt>
                  <dd>{CLUB_BANK_DETAILS.accountName}</dd>
                  <dt className="font-medium text-on-surface-variant">{t("bank")}</dt>
                  <dd>{CLUB_BANK_DETAILS.bankName}</dd>
                  <dt className="font-medium text-on-surface-variant">{t("branch")}</dt>
                  <dd>{CLUB_BANK_DETAILS.branch}</dd>
                  <dt className="font-medium text-on-surface-variant">{t("acc_num")}</dt>
                  <dd>{CLUB_BANK_DETAILS.accountNumber}</dd>
                </dl>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-on-surface">{t("payment_slip")}</label>
                <input
                  name="paymentSlip"
                  required
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-on-primary"
                />
                <p className="text-xs text-on-surface-variant">{t("payment_slip_desc")}</p>
              </div>
            </fieldset>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full mt-4">
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
