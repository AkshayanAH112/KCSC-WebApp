import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Marks } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');
    const query = grade ? { grade: Number(grade) } : {};

    const marksList = await Marks.find(query).populate('studentId', 'name qrCode').sort({ examDate: -1 });
    return NextResponse.json({ marks: marksList });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const data = await request.json();
    const marksData = Array.isArray(data) ? data : [data];

    for (const mark of marksData) {
      await Marks.findOneAndUpdate(
        { studentId: mark.studentId, subject: mark.subject, examDate: mark.examDate },
        mark,
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, count: marksData.length }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
