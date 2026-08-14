import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { GalleryFolder } from '@/models';
import { isStaffRequest } from '@/lib/auth-guard';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    const folder = await GalleryFolder.findById(id);
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    return NextResponse.json({ folder });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isStaffRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;
    const data = await request.json();
    
    const folder = await GalleryFolder.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    
    return NextResponse.json({ folder });
  } catch (error: any) {
    if (error.code === 11000) return NextResponse.json({ error: 'Name already exists' }, { status: 400 });
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
    const folder = await GalleryFolder.findByIdAndDelete(id);
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
