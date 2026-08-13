import nodemailer from 'nodemailer';

/**
 * Gmail SMTP for member-facing emails (currently: membership card on approval).
 * Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.
 *
 * SMTP_PASS must be a Google *App Password*, not the account's normal login
 * password — Gmail rejects plain-password SMTP auth. Generate one at
 * https://myaccount.google.com/apppasswords (requires 2-Step Verification to be
 * turned on for the account first).
 */
export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export type MailAttachment = { filename: string; content: Buffer; contentType?: string };

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: MailAttachment[];
}) {
  if (!isMailConfigured()) {
    throw new Error('Email is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.');
  }
  const transport = getTransport();
  await transport.sendMail({
    from: `Kallar Central Sports Club <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    attachments: opts.attachments,
  });
}
