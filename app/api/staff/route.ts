import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User, USER_ROLES } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';
import { hashPassword } from '@/lib/auth';

/** Admin-only staff account management. Never returns passwordHash. */
export async function GET(request: Request) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const staff = await User.find().select('email role isActive createdAt').sort({ createdAt: -1 });
    return NextResponse.json({ staff });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { email, password, role } = await request.json();

    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (!USER_ROLES.includes(role)) {
      return NextResponse.json({ error: `Role must be one of: ${USER_ROLES.join(', ')}` }, { status: 400 });
    }

    const existing = await User.findOne({ email: email.trim() });
    if (existing) return NextResponse.json({ error: 'That email is already in use' }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const user = await User.create({ email: email.trim(), passwordHash, role, isActive: true });

    return NextResponse.json(
      { user: { _id: user._id, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt } },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
