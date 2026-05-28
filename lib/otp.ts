import nodemailer from "nodemailer";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

type OtpChallengePayload = {
  email: string;
  codeHash: string;
  expiresAt: number;
  nonce: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateIitpEmail(email: string) {
  return /^[a-zA-Z0-9._]+_[a-z0-9]+@iitp\.ac\.in$/.test(normalizeEmail(email));
}

export function createOtp(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const code = randomInt(100000, 1000000).toString();
  const nonce = randomBytes(16).toString("base64url");
  const expiresAt = Date.now() + OTP_TTL_MS;
  const payload: OtpChallengePayload = {
    email: normalizedEmail,
    codeHash: hashOtpCode(normalizedEmail, code, expiresAt, nonce),
    expiresAt,
    nonce,
  };

  return {
    code,
    token: signOtpPayload(payload),
  };
}

export function verifyOtp(email: string, otp: string, token: string) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedOtp = otp.trim();

  if (!/^\d{6}$/.test(normalizedOtp)) {
    return false;
  }

  const payload = readSignedOtpPayload(token);

  if (!payload || payload.email !== normalizedEmail) {
    return false;
  }

  if (Date.now() > payload.expiresAt) {
    return false;
  }

  const expectedHash = hashOtpCode(
    normalizedEmail,
    normalizedOtp,
    payload.expiresAt,
    payload.nonce
  );

  return safeEqual(expectedHash, payload.codeHash);
}

export async function sendOtpEmail(email: string, code: string) {
  const subject = "Re: Your IITP Unofficial Login OTP (❗️important)";
  const text = `Your IIT Patna sign-in OTP is ${code}. It expires in 10 minutes.`;
  const html = `<p>Hello,</p> <p>Your verification code for IITP Unofficial is:</p>
                <p> <strong>${code}</strong> </p>  <p>This code expires in 10 minutes.</p> <p>If you didn't request this code, ignore this email.</p> <p>-IITP Unofficial Team</p>` ;

  const emailFrom = getEmailFrom();

  const transporter = createOtpTransporter();

  await transporter.sendMail({
    from: emailFrom,
    to: email,
    subject,
    text,
    html,
  });
}

function signOtpPayload(payload: OtpChallengePayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getOtpSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function readSignedOtpPayload(token: string): OtpChallengePayload | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", getOtpSecret())
    .update(encodedPayload)
    .digest("base64url");

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<OtpChallengePayload>;

    if (
      typeof payload.email !== "string" ||
      typeof payload.codeHash !== "string" ||
      typeof payload.expiresAt !== "number" ||
      typeof payload.nonce !== "string"
    ) {
      return null;
    }

    return payload as OtpChallengePayload;
  } catch {
    return null;
  }
}

function hashOtpCode(email: string, code: string, expiresAt: number, nonce: string) {
  return createHmac("sha256", getOtpSecret())
    .update("otp-code")
    .update(email)
    .update(code)
    .update(String(expiresAt))
    .update(nonce)
    .digest("base64url");
}

function getOtpSecret() {
  const secret = process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET or AUTH_SECRET is not configured.");
  }

  return secret;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function getEmailFrom() {
  const emailFrom = process.env.EMAIL_FROM?.trim();

  if (emailFrom) {
    return emailFrom;
  }

  const emailUser = process.env.EMAIL_SERVER_USER?.trim();

  if (emailUser) {
    return `IITP Unofficial <${emailUser}>`;
  }

  throw new Error("EMAIL_FROM or EMAIL_SERVER_USER is not configured.");
}

function createOtpTransporter() {
  const emailServer = process.env.EMAIL_SERVER;

  if (emailServer) {
    if (emailServer.includes("smtp.example.com")) {
      throw new Error("EMAIL_SERVER still contains the example SMTP host.");
    }

    //return nodemailer.createTransport(emailServer);
    return nodemailer.createTransport({
      url: emailServer,
      logger: true, // 👈 PASTE HERE
      debug: true,  // 👈 PASTE HERE
    });
  }

  const host = process.env.EMAIL_SERVER_HOST?.trim();
  const port = Number(process.env.EMAIL_SERVER_PORT);
  const user = process.env.EMAIL_SERVER_USER?.trim();
  const password = process.env.EMAIL_SERVER_PASSWORD?.trim();

  if (!host || !port || !user || !password) {
    throw new Error(
      "Email delivery is not configured. Set EMAIL_SERVER or EMAIL_SERVER_HOST, EMAIL_SERVER_PORT, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, and EMAIL_FROM."
    );
  }

  if (host === "smtp.example.com") {
    throw new Error("EMAIL_SERVER_HOST still contains the example SMTP host.");
  }

  if (user === "username" || password === "password") {
    throw new Error("SMTP username or password still contains an example value.");
  }

  const pass = host.includes("gmail.com") ? password.replace(/\s+/g, "") : password;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}
