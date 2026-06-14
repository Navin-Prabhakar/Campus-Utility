"use client";

import { useState, useEffect } from "react"; // 👈 Added useEffect
import Image from "next/image";

const EMAIL_STORAGE_KEY = "savedIitpEmail";

function getSavedEmail() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(EMAIL_STORAGE_KEY) ?? "";
}

export default function SignIn() {
  const [email, setEmail] = useState(getSavedEmail);
  const [step, setStep] = useState<"email" | "sent">("email");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [mounted, setMounted] = useState(false); // 👈 1. Added mounted state tracking

  // 👈 2. Set mounted to true as soon as the client browser loads
  useEffect(() => {
    setMounted(true);
  }, []);

  const sendActivationLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    // Frontend validation check
    if (!email.endsWith("@iitp.ac.in")) {
      setError("❌ Access restricted to valid @iitp.ac.in emails.");
      setLoading(false);
      return;
    }

    try {
      // Trigger our new spam-resistant activation link backend API
      const response = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to send link. Please try again.");
        return;
      }

      setStep("sent");
      setInfo("📩 Activation link sent! Please open your official Microsoft Outlook mail app to verify.");
      
      if (rememberDevice && typeof window !== "undefined") {
        window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
      }
    } catch (err) {
      setError("An error occurred while dispatching the link. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
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
          <p className="text-center text-sm text-slate-600">Secure activation via your college email</p>
        </div>

        <form onSubmit={sendActivationLink} className="flex flex-col gap-4">
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
              disabled={loading || step === "sent"}
              className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 transition hover:bg-slate-100 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            />
            <p className="text-xs text-slate-500">
              Example: navin_2503ai02@iitp.ac.in
            </p>
          </div>

          {step === "email" && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <input
                id="rememberDevice"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="rememberDevice">Remember my email</label>
            </div>
          )}

          {info && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700 border border-blue-200">
              {info}
            </div>
          )}

          {error && (
            <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {step === "email" ? (
            <button
              type="submit"
              // 👈 3. Included !mounted protection to keep initial HTML perfectly identical to the server
              disabled={!mounted || loading || !email}
              className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Get Activation Link"}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => setStep("email")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Try a different email
            </button>
          )}
        </form>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-center text-xs text-slate-600">
            Only students with active @iitp.ac.in credentials can verify. The system utilizes formal transaction pathways to bypass campus firewalls.
          </p>
        </div>
      </div>
    </div>
  );
}