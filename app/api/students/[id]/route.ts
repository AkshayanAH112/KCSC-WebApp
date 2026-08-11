import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Student, Attendance, Marks } from '@/models';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await context.params;

    const student = await Student.findById(id).populate('batchId');
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const [attendance, marks] = await Promise.all([
      Attendance.find({ studentId: id }).populate('classId').sort({ date: -1 }),
      Marks.find({ studentId: id }).sort({ examDate: -1 })
    ]);

    // Analytics
    const totalClasses = attendance.length;
    const classesPresent = attendance.filter(a => a.present).length;
    const attendancePercentage = totalClasses > 0 ? Math.round((classesPresent / totalClasses) * 100) : 0;

    let totalMarks = 0, totalMax = 0;
    marks.forEach(m => { totalMarks += m.marks; totalMax += m.maxMarks; });
    const averageMarks = totalMax > 0 ? Math.round((totalMarks / totalMax) * 100) : 0;

    // Per-subject averages drive the marks analysis chart on the student page.
    const bySubject = new Map<string, { subject: string; scored: number; max: number; count: number }>();
    for (const m of marks) {
      const entry = bySubject.get(m.subject) ?? { subject: m.subject, scored: 0, max: 0, count: 0 };
      entry.scored += m.marks;
      entry.max += m.maxMarks;
      entry.count += 1;
      bySubject.set(m.subject, entry);
    }
    const subjectAverages = [...bySubject.values()].map((s) => ({
      subject: s.subject,
      average: s.max > 0 ? Math.round((s.scored / s.max) * 100) : 0,
      count: s.count,
    }));

    return NextResponse.json({
      student,
      attendance,
      marks,
      analytics: {
        attendancePercentage,
        classesPresent,
        totalClasses,
        averageMarks,
        subjectAverages,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
