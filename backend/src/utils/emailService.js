import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  return transporter;
};

export const sendVerificationEmail = async (toEmail, token) => {
  const t = getTransporter();

  const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const link = `${baseUrl}/verify-email?token=${token}`;

  if (!t) {
    // Dev fallback: log the link so the developer can verify manually
    console.warn(
      `[emailService] EMAIL_USER / EMAIL_PASS not configured.\n` +
      `Verification link for ${toEmail}:\n${link}`
    );
    return;
  }

  await t.sendMail({
    from: `"JobPulse" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Verify your Gmail – JobPulse",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:36px;background:#f8fafc;border-radius:16px;border:1px solid #e2e8f0">
        <div style="margin-bottom:24px">
          <span style="font-size:22px;font-weight:700;color:#0ea5e9">JobPulse</span>
        </div>
        <h2 style="color:#0f172a;margin:0 0 8px">Verify your Gmail address</h2>
        <p style="color:#475569;line-height:1.6;margin:0 0 8px">
          You're almost there! Click the button below to verify your Gmail and activate your account.
        </p>
        <p style="color:#94a3b8;font-size:13px;margin:0 0 24px">
          This link expires in <strong>24 hours</strong>.
        </p>
        <a href="${link}"
           style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#38bdf8);color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">
          ✉️  Verify my Gmail
        </a>
        <p style="margin-top:32px;color:#94a3b8;font-size:12px">
          If you didn't sign up for JobPulse, you can safely ignore this email.
        </p>
      </div>
    `
  });
};
