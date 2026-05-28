import nodemailer from "nodemailer";

const otpRecords = new Map<string, { code: string; expiresAt: number; attempts: number }>();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateIitpEmail(email: string) {
  return /^[a-zA-Z0-9._]+_[a-z0-9]+@iitp\.ac\.in$/.test(normalizeEmail(email));
}

export function createOtp(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpRecords.set(normalizedEmail, {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
  return code;
}

export function verifyOtp(email: string, otp: string) {
  const normalizedEmail = normalizeEmail(email);
  const record = otpRecords.get(normalizedEmail);
  if (!record) {
    return false;
  }

  if (Date.now() > record.expiresAt) {
    otpRecords.delete(normalizedEmail);
    return false;
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    otpRecords.delete(normalizedEmail);
    return false;
  }

  if (record.code !== otp) {
    record.attempts += 1;
    otpRecords.set(normalizedEmail, record);
    return false;
  }

  otpRecords.delete(normalizedEmail);
  return true;
}

export async function sendOtpEmail(email: string, code: string) {
  const subject = "Your IIT Patna OTP Code";
  const text = `Your IIT Patna sign-in OTP is ${code}. It expires in 10 minutes.`;
  const html = `<p>Your IIT Patna sign-in OTP is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`;

  const emailServer = process.env.EMAIL_SERVER;
  const emailFrom = process.env.EMAIL_FROM || "no-reply@iitp.ac.in";

  if (!emailServer) {
    console.log(`[OTP] Sending OTP to ${email}: ${code}`);
    return;
  }

  const transporter = nodemailer.createTransport(emailServer);

  await transporter.sendMail({
    from: emailFrom,
    to: email,
    subject,
    text,
    html,
  });
}
