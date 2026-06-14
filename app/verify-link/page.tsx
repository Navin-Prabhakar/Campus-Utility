"use client";

import { useEffect, useState, Suspense } from "react"; // 👈 Imported Suspense
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

// 1. Move the core verification interface into its own sub-component
function VerifyLinkContent() {
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
        const result = await signIn("magic-link", {
          token,
          redirect: false,
        });

        if (result?.error) {
          setStatus("error");
          setErrorMessage(result.error || "This link has expired or is invalid.");
          return;
        }

        setStatus("success");
        setTimeout(() => {
          router.push("/"); 
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
  );
}

// 2. The main default export wraps the content in a Suspense boundary for Next.js build optimization
export default function VerifyLinkPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 text-white">
      <Suspense 
        fallback={
          <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-2xl flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-transparent"></div>
            <h2 className="text-xl font-bold text-slate-900">Loading Router Channels...</h2>
          </div>
        }
      >
        <VerifyLinkContent />
      </Suspense>
    </div>
  );
}