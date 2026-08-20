"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Download } from "lucide-react";

/**
 * Shared by the students list page ("Get ID" per row) and the student detail
 * page, so a card is reachable any time after registration, not just once.
 */
export function StudentIdCardModal({ student, onClose }: { student: any; onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(student.qrCode, { margin: 1, scale: 10 }).then(setQrDataUrl);
  }, [student.qrCode]);

  const downloadIdCard = async () => {
    // html2canvas-pro, not html2canvas: the plain package's color parser doesn't
    // understand oklch()/lab()/color() — this app's whole design system is built on
    // oklch CSS variables (Tailwind v4 default), so every capture would throw
    // "unsupported color function". The -pro fork adds that support; same API.
    const html2canvas = (await import('html2canvas-pro')).default;
    const card = document.getElementById('printable-id-card');
    if (!card) return;
    const canvas = await html2canvas(card, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `${student.name?.replace(/\s+/g, '_')}_ID_Card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!qrDataUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white" onClick={onClose}>
      {/* CSS to isolate the ID card when physical printing is triggered */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-id-card, #printable-id-card * { visibility: visible; }
          #printable-id-card { position: absolute; left: 0; top: 0; margin: 0; padding: 0; border: none; box-shadow: none; transform: scale(1.05); transform-origin: top left; }
        }
      `}} />

      <div className="bg-white rounded-3xl p-8 max-w-100 w-full shadow-2xl flex flex-col items-center print:shadow-none print:p-0 print:m-0" onClick={e => e.stopPropagation()}>

        <div className="flex justify-between w-full mb-6 print:hidden items-center">
          <h3 className="text-xl font-bold text-gray-900">Student ID Card</h3>
          <div className="flex gap-2">
            <button className="text-primary bg-primary/10 px-3 py-1.5 rounded-lg font-bold hover:bg-primary/10 transition-colors" onClick={() => window.print()}>Print Card</button>
            <button className="flex items-center gap-1.5 text-white bg-primary px-3 py-1.5 rounded-lg font-bold hover:bg-primary/90 transition-colors" onClick={downloadIdCard}><Download size={15}/>Download</button>
          </div>
        </div>

        {/* Card art is the club's Canva-designed template (public/id-card-template.png);
            only the fields below are overlaid — everything else (crest, title, tagline,
            icons, labels, footer line) is baked into that image. Positions are percentages
            derived from the template's native 1586x992 canvas, so they hold up at any
            render size including html2canvas's 4x capture scale. */}
        {/* Height is 85.6mm scaled to the template's native 1586x992 ratio (not the
            CR-80 standard 53.98mm) so the background image is never stretched. */}
        <div
          id="printable-id-card"
          className="relative w-[85.6mm] h-[53.54mm] shrink-0 rounded-2xl overflow-hidden"
        >
          <Image src="/id-card-template.png" alt="" fill priority className="object-cover" />

          <h4
            className="absolute font-bold text-[#14213D] uppercase leading-[1.05] line-clamp-2"
            style={{ left: "8%", top: "38%", width: "45%", height: "13%", fontSize: "17px" }}
          >
            {student.name}
          </h4>

          <p
            className="absolute flex items-center font-extrabold text-white uppercase tracking-wide"
            style={{ left: "8.5%", top: "52.3%", width: "30%", height: "7%", fontSize: "6.5px" }}
          >
            {student.batchId?.name ?? "Scholarship Batch"}
          </p>

          <p
            className="absolute font-semibold text-gray-800"
            style={{ left: "28%", top: "69.5%", width: "35%", fontSize: "8px", transform: "translateY(-50%)" }}
          >
            {student.grade}
          </p>

          <p
            className="absolute font-semibold text-gray-800"
            style={{ left: "28%", top: "79.3%", width: "35%", fontSize: "8px", transform: "translateY(-50%)" }}
          >
            {student.guardianPhone}
          </p>

          <div
            className="absolute flex items-center justify-center"
            style={{ left: "66.9%", top: "25.7%", width: "25.5%", height: "37.8%" }}
          >
            <Image src={qrDataUrl} alt="QR Code" width={200} height={200} unoptimized className="w-[88%] h-auto" />
          </div>

          <p
            className="absolute text-center text-gray-500 font-mono tracking-tight"
            style={{ left: "66.9%", top: "64.8%", width: "25.5%", fontSize: "7px" }}
          >
            {student.qrCode}
          </p>
        </div>

        <button onClick={onClose} className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-medium mt-8 print:hidden transition-colors">Close</button>
      </div>
    </div>
  );
}
