import { signOut } from "next-auth/react";

export async function POST() {
  return Response.json({ ok: true });
}
