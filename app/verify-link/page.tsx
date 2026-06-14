"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function VerifyLinkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage("The activation link is missing its security token.");
      return;
    }

    async function authenticateUser() {
      try {
        // 1. Hand the token over to our central NextAuth [...nextauth] engine
        const result = await signIn("magic-link", {
          token,
          redirect: false, // Don't reload the page, let us handle the transition smoothly
        });

        if (result?.error) {
          setStatus("error");
          setErrorMessage(result.error || "This link has expired or is invalid.");
          return;
        }

        // 2. Success! The session cookie is set. Forward them immediately to the features.
        setStatus("success");
        setTimeout(() => {
          router.push("/"); // 👈 Change this to "/bus" or your main page path
          router.refresh();
        }, 1500);

      } catch (err) {
        console.error("Verification page error:", err);
        setStatus("error");
        setErrorMessage("An unexpected error occurred during activation.");
      }
    }

    authenticateUser();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 text-white">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-2xl">
        
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <h2 className="text-xl font-bold text-slate-900">Verifying Campus Profile...</h2>
            <p className="text-sm text-slate-600">Decrypting security token and securing your firewall pass.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
              ✓
            </div>
            <h2 className="text-xl font-bold text-slate-900">Access Granted!</h2>
            <p className="text-sm text-slate-600">Welcome back. Redirecting you straight to campus utilities...</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-slate-900">Activation Failed</h2>
            <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
            <button
              onClick={() => router.push("/signin")}
              className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Request a New Link
            </button>
          </div>
        )}

      </div>
    </div>
  );
}