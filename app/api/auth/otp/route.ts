import { NextRequest, NextResponse } from "next/server";
import { createOtp, sendOtpEmail, validateIitpEmail } from "@/lib/otp";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email =
    body &&
    typeof body === "object" &&
    "email" in body &&
    typeof body.email === "string"
      ? body.email.trim()
      : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!validateIitpEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Please use your IIT Patna email (name_rollNumber@iitp.ac.in, roll number can contain digits and lowercase letters)",
      },
      { status: 400 }
    );
  }

  const { code, token } = createOtp(email);

  try {
    await sendOtpEmail(email, code);
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    const detail =
      error instanceof Error && process.env.NODE_ENV !== "production"
        ? ` ${error.message}`
        : "";

    return NextResponse.json(
      { error: `Unable to send OTP email.${detail}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "OTP has been sent to your email.",
    otpToken: token,
  });
}
