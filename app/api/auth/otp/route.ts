import { NextRequest, NextResponse } from "next/server";
import { createOtp, sendOtpEmail, validateIitpEmail } from "@/lib/otp";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";

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

  const code = createOtp(email);

  try {
    await sendOtpEmail(email, code);
  } catch (error) {
    console.error("Failed to send OTP email:", error);
  }

  return NextResponse.json({ ok: true, message: "OTP has been sent to your email." });
}
