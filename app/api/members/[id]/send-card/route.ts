import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Member } from '@/models';
import { isAdminOnlyRequest } from '@/lib/auth-guard';
import { sendMail } from '@/lib/mail';

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Buffer.from(base64, 'base64');
}

/**
 * Emails the approved member their membership card (front + back), rendered
 * client-side by MembershipCardFront/Back (components/membership-card.tsx) and
 * captured with html2canvas-pro on app/(admin)/admin/members/[id]/page.tsx —
 * the same reason the student ID card is captured client-side rather than with a
 * server-side headless browser: no heavyweight rendering dependency in a
 * serverless function, and the credentials stay server-side regardless.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminOnlyRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectToDatabase();
    const { id } = await context.params;

    const member = await Member.findById(id);
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if (!member.email) return NextResponse.json({ error: 'This member has no email address on file.' }, { status: 400 });

    const { front, back } = await request.json();
    if (typeof front !== 'string' || typeof back !== 'string') {
      return NextResponse.json({ error: 'Missing card images' }, { status: 400 });
    }

    await sendMail({
      to: member.email,
      subject: 'Welcome to Kallar Central Sports Club — your membership card',
      text: `Hi ${member.fullName},\n\nCongratulations — your membership application has been approved! Your membership card (ID: ${member.memberCode ?? ''}) is attached.\n\nWelcome to the club.\n\nKallar Central Sports Club`,
      html: `<p>Hi ${member.fullName},</p><p>Congratulations — your membership application has been approved! Your membership card (ID: <strong>${member.memberCode ?? ''}</strong>) is attached to this email.</p><p>Welcome to the club.</p><p>Kallar Central Sports Club</p>`,
      attachments: [
        { filename: 'membership-card-front.png', content: dataUrlToBuffer(front), contentType: 'image/png' },
        { filename: 'membership-card-back.png', content: dataUrlToBuffer(back), contentType: 'image/png' },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Failed to send email' }, { status: 500 });
  }
}
