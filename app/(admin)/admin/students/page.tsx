"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import { Plus, Search, Loader2, QrCode as QrIcon, Download } from "lucide-react";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [activeQr, setActiveQr] = useState<string | null>(null);
  const [activeStudent, setActiveStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    guardianName: "",
    guardianPhone: "",
    batchId: "",
    grade: "3",
    dateOfBirth: "",
  });

  // Inline "create new batch" — reached from the Batch select below when no
  // batch fits yet, instead of having to leave the registration form.
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [newBatchForm, setNewBatchForm] = useState({ name: "", year: new Date().getFullYear() });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [sRes, bRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/batches")
      ]);
      const sData = await sRes.json();
      const bData = await bRes.json();
      setStudents(sData.students || []);
      setBatches(bData.batches || []);
      if (bData.batches?.length > 0) {
        setFormData(prev => ({ ...prev, batchId: bData.batches[0]._id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, grade: Number(formData.grade) }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: "", guardianName: "", guardianPhone: "", batchId: batches[0]?._id || "", grade: "3", dateOfBirth: "" });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBatchSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "__new__") {
      setIsNewBatchModalOpen(true);
      return;
    }
    setFormData({ ...formData, batchId: e.target.value });
  };

  const createBatchInline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newBatchForm, grades: [3, 4, 5] }),
      });
      const data = await res.json();
      if (res.ok) {
        setBatches(prev => [data.batch, ...prev]);
        setFormData(prev => ({ ...prev, batchId: data.batch._id }));
        setIsNewBatchModalOpen(false);
        setNewBatchForm({ name: "", year: new Date().getFullYear() });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showQrCode = async (student: any) => {
    try {
      const url = await QRCode.toDataURL(student.qrCode, { margin: 1, scale: 10 });
      setActiveQr(url);
      setActiveStudent(student);
      setQrModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

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
    link.download = `${activeStudent?.name?.replace(/\s+/g, '_')}_ID_Card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (filterBatch === "" || s.batchId?._id === filterBatch)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Management</h1>
          <p className="text-gray-500">Register students and generate physical QR ID cards.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium"
        >
          <Plus size={20} /> Register Student
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search students by name..." 
            className="field pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="field sm:w-48"
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
        >
          <option value="">All Batches</option>
          {batches.map(b => (
            <option key={b._id} value={b._id}>{b.name} ({b.year})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Batch / Grade</th>
                  <th className="px-6 py-4">Guardian</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">QR Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredStudents.map((sys) => (
                  <tr 
                    key={sys._id} 
                    onClick={() => router.push(`/admin/students/${sys._id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors text-gray-900 dark:text-gray-100 cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium">{sys.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-gray-900 dark:text-gray-100">{sys.batchId?.name || 'No Batch'}</span>
                        <span className="bg-primary/10 dark:bg-primary/15 text-primary px-2 py-1 rounded-md text-xs w-fit">Grade {sys.grade}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{sys.guardianName}</td>
                    <td className="px-6 py-4">{sys.guardianPhone}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); showQrCode(sys); }}
                        className="text-primary hover:text-primary/80 font-medium flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <QrIcon size={16} /> Get ID
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No students registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Register New Student</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="field-label">Full Name</label><input required className="field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className="field-label">Guardian Name</label><input required className="field" value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} /></div>
              <div><label className="field-label">Guardian Phone (SMS)</label><input required className="field" placeholder="e.g. +94771234567" value={formData.guardianPhone} onChange={e => setFormData({...formData, guardianPhone: e.target.value})} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Batch</label>
                  <select required className="field cursor-pointer" value={formData.batchId} onChange={handleBatchSelect}>
                    {batches.length === 0 && <option value="" disabled>No batches yet</option>}
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.name} ({b.year})</option>
                    ))}
                    <option value="__new__">+ Add New Batch</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Current Grade</label>
                  <select className="field" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="field-label">Date of Birth</label>
                <input type="date" required className="field" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-border bg-card rounded-xl font-medium text-foreground hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium">Create & Generate QR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline "New Batch" — reached from the Batch select above so registering a
          student never has to be blocked on leaving to /admin/batches first. */}
      {isNewBatchModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 sm:p-8 rounded-3xl max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">New Batch</h2>
            <form onSubmit={createBatchInline} className="space-y-4">
              <div>
                <label className="field-label">Batch Name</label>
                <input required autoFocus className="field" placeholder="e.g. 2027 Scholarship Batch" value={newBatchForm.name} onChange={e => setNewBatchForm({ ...newBatchForm, name: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Starting Year</label>
                <input type="number" required className="field" value={newBatchForm.year} onChange={e => setNewBatchForm({ ...newBatchForm, year: Number(e.target.value) })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsNewBatchModalOpen(false); setFormData(prev => ({ ...prev, batchId: batches[0]?._id || "" })); }}
                  className="flex-1 py-2 border border-border bg-card rounded-xl font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-xl font-medium">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal & Printable ID Card */}
      {qrModalOpen && activeQr && activeStudent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white" onClick={() => setQrModalOpen(false)}>
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
                {activeStudent.name}
              </h4>

              <p
                className="absolute flex items-center font-extrabold text-white uppercase tracking-wide"
                style={{ left: "8.5%", top: "52.3%", width: "30%", height: "7%", fontSize: "6.5px" }}
              >
                {activeStudent.batchId?.name ?? "Scholarship Batch"}
              </p>

              <p
                className="absolute font-semibold text-gray-800"
                style={{ left: "28%", top: "69.5%", width: "35%", fontSize: "8px", transform: "translateY(-50%)" }}
              >
                {activeStudent.grade}
              </p>

              <p
                className="absolute font-semibold text-gray-800"
                style={{ left: "28%", top: "79.3%", width: "35%", fontSize: "8px", transform: "translateY(-50%)" }}
              >
                {activeStudent.guardianPhone}
              </p>

              <div
                className="absolute flex items-center justify-center"
                style={{ left: "66.9%", top: "25.7%", width: "25.5%", height: "37.8%" }}
              >
                <Image src={activeQr} alt="QR Code" width={200} height={200} unoptimized className="w-[88%] h-auto" />
              </div>

              <p
                className="absolute text-center text-gray-500 font-mono tracking-tight"
                style={{ left: "66.9%", top: "64.8%", width: "25.5%", fontSize: "7px" }}
              >
                {activeStudent.qrCode}
              </p>
            </div>

            <button onClick={() => setQrModalOpen(false)} className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-medium mt-8 print:hidden transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
