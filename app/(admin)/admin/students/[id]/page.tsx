"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Loader2, ArrowLeft, AlertTriangle, GraduationCap } from "lucide-react";

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/students/${studentId}`).then(r => r.json()).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [studentId]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  if (!data?.student) return <div className="p-12 text-center">Student not found</div>;

  const { student, analytics, marks } = data;

  const chartData = marks.slice().reverse().map((m: any) => ({
    name: m.subject,
    percentage: Math.round((m.marks / m.maxMarks) * 100)
  }));

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
        <ArrowLeft size={20} /> Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-primary"></div>
          <div className="relative mt-8 flex flex-col items-center">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center shadow-lg mb-4">
              <span className="text-3xl font-bold text-primary">{student.name.charAt(0)}</span>
            </div>
            <h2 className="text-2xl font-bold dark:text-white">{student.name}</h2>
            <span className="bg-primary/10 dark:bg-primary/15 text-primary font-bold px-3 py-1 rounded-full text-sm mt-2">Grade {student.grade}</span>
            
            <div className="w-full mt-8 space-y-4">
              <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <span className="text-gray-500">Guardian</span>
                <span className="font-medium dark:text-gray-200">{student.guardianName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium dark:text-gray-200">{student.guardianPhone}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <span className="text-gray-500">QR ID</span>
                <span className="font-medium dark:text-gray-200">{student.qrCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          <div className="card-gold-rule flex flex-col justify-center p-6 shadow-xs">
            <h3 className="mb-2 font-medium text-muted-foreground">Overall Attendance</h3>
            <div className="flex items-center gap-3">
              <span
                className={`tabular text-4xl font-bold ${
                  analytics.attendancePercentage >= 75 ? "text-success" : "text-warning"
                }`}
              >
                {analytics.attendancePercentage}%
              </span>
              {analytics.attendancePercentage < 75 && (
                <AlertTriangle className="text-warning" size={28} aria-hidden />
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Present for {analytics.classesPresent} of {analytics.totalClasses} recorded sessions
            </p>
          </div>

          <div className="card-gold-rule flex flex-col justify-center p-6 shadow-xs">
            <h3 className="mb-2 font-medium text-muted-foreground">Average Marks</h3>
            <div className="flex items-center gap-3">
              <span className="tabular text-4xl font-bold text-primary">
                {analytics.averageMarks}%
              </span>
              <GraduationCap className="text-gold" size={28} aria-hidden />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Across {marks.length} recorded {marks.length === 1 ? "result" : "results"}
            </p>
          </div>

          <div className="sm:col-span-2 rounded-lg border border-border bg-card p-6 shadow-xs">
            <h3 className="mb-6 font-medium text-muted-foreground">Subject Performance History</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" domain={[0, 100]} fontSize={12} />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, "Score"]}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--card-foreground)",
                    }}
                  />
                  <Bar dataKey="percentage" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
