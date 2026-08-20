"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Users, BookOpen, ArrowRight } from "lucide-react";

const GRADES = [3, 4, 5];

export default function GradesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/batches"), fetch("/api/students")])
      .then(async ([bRes, sRes]) => {
        const bData = await bRes.json();
        const sData = await sRes.json();
        setBatches(bData.batches || []);
        setStudents(sData.students || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grades</h1>
        <p className="text-gray-500 text-sm">
          Grades are fixed to 3, 4 and 5 for this tuition programme — this page is an overview, not a place to add more.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {GRADES.map((grade) => {
          const gradeBatches = batches.filter((b) => b.grades.includes(grade));
          const gradeStudents = students.filter((s) => s.grade === grade);
          const activeStudents = gradeStudents.filter((s) => s.isActive !== false).length;

          return (
            <div key={grade} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-primary/10 dark:bg-primary/15 text-primary w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold">
                  G{grade}
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Grade {grade}</h2>
              </div>

              <div className="space-y-3">
                <Link
                  href={`/admin/batches?grade=${grade}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={18} className="text-primary" />
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">{gradeBatches.length}</div>
                      <div className="text-xs text-gray-500">{gradeBatches.length === 1 ? "Batch" : "Batches"}</div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                </Link>

                <Link
                  href={`/admin/students?grade=${grade}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-primary transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Users size={18} className="text-primary" />
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">{gradeStudents.length}</div>
                      <div className="text-xs text-gray-500">
                        {gradeStudents.length === 1 ? "Student" : "Students"}
                        {gradeStudents.length > 0 && ` (${activeStudents} active)`}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
