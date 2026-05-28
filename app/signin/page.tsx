"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const EMAIL_STORAGE_KEY = "savedIitpEmail";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(EMAIL_STORAGE_KEY);
    if (saved) {
      setEmail(saved);
    }
  }, []);

  const sendOtp = async () => {
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to send OTP. Please try again.");
        return;
      }

      setStep("otp");
      setInfo("OTP sent to your IIT Patna email. Please enter the code below.");
      if (rememberDevice && typeof window !== "undefined") {
        window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
      }
    } catch (err) {
      setError("An error occurred while sending OTP. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        otp,
        redirect: false,
      });

      if (result?.ok) {
        if (rememberDevice && typeof window !== "undefined") {
          window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
        }
        router.push("/");
      } else {
        setError(result?.error || "OTP verification failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred during verification. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "email") {
      await sendOtp();
    } else {
      await verifyOtp();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/iitp-logo.png"
            alt="IIT Patna logo"
            width={80}
            height={80}
            className="h-16 w-16"
          />
          <h1 className="text-center text-2xl font-bold text-slate-900">IITP Unofficial</h1>
          <p className="text-center text-sm text-slate-600">Sign in with your college email and OTP</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-900">
              IIT Patna Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="name_rollnumber@iitp.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || step === "otp"}
              className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 transition hover:bg-slate-100 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            />
            <p className="text-xs text-slate-500">
              Example: navin_2503ai02@iitp.ac.in
            </p>
          </div>

          {step === "otp" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="otp" className="text-sm font-medium text-slate-900">
                OTP Code
              </label>
              <input
                id="otp"
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 transition hover:bg-slate-100 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <input
              id="rememberDevice"
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="rememberDevice">Remember this device</label>
          </div>

          {info && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              {info}
            </div>
          )}

          {error && (
            <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || (step === "otp" && !otp)}
            className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : step === "email" ? "Send OTP" : "Verify OTP"}
          </button>

          {step === "otp" && (
            <button
              type="button"
              disabled={loading}
              onClick={sendOtp}
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Resend OTP
            </button>
          )}
        </form>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-center text-xs text-slate-600">
            Only students with valid IIT Patna email addresses can sign in, and OTP verification is required on first login.
          </p>
        </div>
      </div>
    </div>
  );
}
