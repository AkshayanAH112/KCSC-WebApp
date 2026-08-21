import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Student, Attendance, Marks, Notification } from '@/models';
import { isStaffRequest, isAdminOnlyRequest } from '@/lib/auth-guard';
import { isValidLocalPhone, isPastDate } from '@/lib/validation';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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

const STUDENT_EDITABLE_FIELDS = [
  'name', 'school', 'address', 'guardianName', 'guardianPhone', 'grade', 'dateOfBirth', 'batchId', 'photoUrl', 'isActive',
] as const;

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    const data = await request.json();

    const existing = await Student.findById(id);
    if (!existing) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    if (data.guardianPhone !== undefined && !isValidLocalPhone(data.guardianPhone)) {
      return NextResponse.json({ error: 'Guardian phone must be a valid 10-digit number starting with 0 (e.g. 0701212234)' }, { status: 400 });
    }
    if (data.dateOfBirth !== undefined && !isPastDate(data.dateOfBirth)) {
      return NextResponse.json({ error: 'Date of birth must be in the past' }, { status: 400 });
    }

    // qrCode is deliberately never editable here — it's already printed on a
    // physical ID card; regenerating it would silently orphan that card.
    const update: Record<string, unknown> = {};
    for (const field of STUDENT_EDITABLE_FIELDS) {
      if (data[field] !== undefined) update[field] = data[field];
    }

    // registrationNumber is never editable by a plain staff PATCH — only an
    // admin, and only when explicitly opting in, can override it.
    if (data.registrationNumber !== undefined) {
      if (!data.allowRegistrationNumberEdit || !(await isAdminOnlyRequest(request))) {
        return NextResponse.json(
          { error: 'Registration number can only be changed by an admin, with allowRegistrationNumberEdit: true' },
          { status: 403 }
        );
      }
      update.registrationNumber = data.registrationNumber;
    }

    // Reactivation: a fresh leave cycle starts from here. Total leaves is
    // never touched — only the current cycle resets, and cycleGeneration
    // bumps so the 2/3-leave notifications are free to fire again in it.
    if (data.isActive === true && existing.isActive === false) {
      update.currentLeaveCycle = 0;
      update.cycleGeneration = existing.cycleGeneration + 1;
    }

    const student = await Student.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json({ student });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // A student with attendance/marks history is meaningful for reporting even
    // after they leave the programme — deactivate (the schema already has
    // isActive for exactly this) instead of erasing that history.
    const [attendanceCount, marksCount] = await Promise.all([
      Attendance.countDocuments({ studentId: id }),
      Marks.countDocuments({ studentId: id }),
    ]);
    if (attendanceCount > 0 || marksCount > 0) {
      if (!force) {
        return NextResponse.json(
          { error: `Cannot delete: this student has ${attendanceCount} attendance record(s) and ${marksCount} mark(s). Deactivate instead (PATCH { isActive: false }), or pass ?force=true to permanently erase everything (admin only).` },
          { status: 409 }
        );
      }
      // Force delete is a deliberate, irreversible override of the guard
      // above — admin-only, and cascades every record that references this
      // student so nothing orphaned is left behind.
      if (!(await isAdminOnlyRequest(request))) {
        return NextResponse.json({ error: 'Only an admin can force-delete a student with existing records' }, { status: 403 });
      }
      await Promise.all([
        Attendance.deleteMany({ studentId: id }),
        Marks.deleteMany({ studentId: id }),
        Notification.deleteMany({ studentId: id }),
      ]);
    }

    const student = await Student.findByIdAndDelete(id);
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
