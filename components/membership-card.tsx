import Image from "next/image";

/**
 * Card art is the club's Canva-designed template (public/membership-card-front.png
 * and -back.png, cropped from the single front+back source design); only the
 * fields below are overlaid — crest, title, tagline, field labels, terms text and
 * the footer line are all baked into the images. Positions are percentages of each
 * crop's native size (front 1582x504, back 1582x473), measured directly off the
 * template, so they hold up at any render size including html2canvas's capture
 * scale. Font sizes are fixed px, not relative units — html2canvas-pro needs
 * plain resolved values, same as the student ID card
 * (app/(admin)/admin/students/page.tsx).
 */

const FRONT_RATIO = 504 / 1582;
const BACK_RATIO = 473 / 1582;

export type MembershipCardMember = {
  fullName: string;
  memberCode?: string;
  memberType?: string;
  nic?: string;
  reviewedAt?: string;
  photoUrl?: string;
};

export function MembershipCardFront({
  member,
  cardRef,
  width = 650,
}: {
  member: MembershipCardMember;
  cardRef?: React.Ref<HTMLDivElement>;
  width?: number;
}) {
  const height = Math.round(width * FRONT_RATIO);
  const joiningDate = member.reviewedAt
    ? new Date(member.reviewedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div ref={cardRef} className="relative shrink-0 overflow-hidden rounded-xl" style={{ width, height }}>
      <Image src="/membership-card-front.png" alt="" fill priority className="object-cover" />

      <div
        className="absolute overflow-hidden rounded-lg"
        style={{ left: "65.04%", top: "19.05%", width: "13.59%", height: "45.83%" }}
      >
        {member.photoUrl ? (
          <Image src={member.photoUrl} alt="" fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-[#f6f1ee]" />
        )}
      </div>

      {/* Value column starts right after the labels' colon (measured directly off
          the template) — the crest/wreath graphic extends further right than it
          looks, so anything left of ~44% overlaps it. Each row is a positioned
          band with flex centering, not a translateY(-50%) transform —
          html2canvas-pro doesn't reliably resolve transforms on absolutely
          positioned percentage boxes, which is what produced the badly
          mispositioned first render of this card. NAME/MEMBER ID/MEMBER TYPE/
          JOINING DATE labels are baked into the template; NIC isn't (it's a 5th
          row added on top of a 4-row template, spaced slightly tighter to fit
          before the bottom-right corner accent), so its label is drawn here. */}
      {[
        { top: "65.0%", label: null, value: member.fullName },
        { top: "72.6%", label: null, value: member.memberCode ?? "—" },
        { top: "80.2%", label: null, value: member.memberType ?? "—" },
        { top: "87.8%", label: null, value: joiningDate },
        { top: "92.6%", label: "NIC", value: member.nic ?? "—" },
      ].map((row, i) => (
        <div
          key={i}
          className="absolute flex items-center gap-1"
          style={{ left: "44%", top: row.top, width: "21%", height: "6%" }}
        >
          {row.label && (
            <span className="shrink-0 font-bold text-[#3d0000]" style={{ fontSize: 9 }}>
              {row.label} :
            </span>
          )}
          <span className="truncate font-semibold text-[#3d0000]" style={{ fontSize: 9 }}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function SignatureSlot({ left, width, label }: { left: string; width: string; label: string }) {
  const file = `/signature-${label.toLowerCase()}.png`;
  return (
    <div className="absolute flex flex-col items-center" style={{ left, top: "75%", width, height: "14%" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- plain <img> so a missing
          signature file (not supplied yet) fails silently via onError instead of
          Next's image pipeline; drop the real file in /public and it renders automatically. */}
      <img
        src={file}
        alt={`${label}'s signature`}
        className="max-h-[70%] object-contain"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <div className="mt-auto w-full border-t border-[#8c7b72]" />
      <span className="mt-1 text-[10px] font-semibold text-[#3d0000]">{label}</span>
    </div>
  );
}

export function MembershipCardBack({ cardRef, width = 650 }: { cardRef?: React.Ref<HTMLDivElement>; width?: number }) {
  const height = Math.round(width * BACK_RATIO);

  return (
    <div ref={cardRef} className="relative shrink-0 overflow-hidden rounded-xl" style={{ width, height }}>
      <Image src="/membership-card-back.png" alt="" fill priority className="object-cover" />
      {/* Kept clear of the maroon left panel and the diagonal corner accent bottom-right. */}
      <SignatureSlot left="38%" width="18%" label="President" />
      <SignatureSlot left="60%" width="18%" label="Secretary" />
    </div>
  );
}
