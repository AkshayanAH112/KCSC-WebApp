"use client";

export default function RenewLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("open-renew-modal"))}
      className={className}
    >
      Renew Membership
    </button>
  );
}
