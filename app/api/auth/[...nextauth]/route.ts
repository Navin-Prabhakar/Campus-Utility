import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import jwt from "jsonwebtoken";

const LINK_SECRET = process.env.NEXTAUTH_SECRET || "fallback_secret";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "magic-link",
      name: "IIT Patna Email Activation",
      credentials: {
        token: { label: "Activation Token", type: "text" },
      },
      async authorize(credentials) {
        const token = credentials?.token;
        if (!token) {
          throw new Error("Missing verification authentication token.");
        }

        try {
          // 1. Verify and decrypt the cryptographically signed URL link token
          const decoded = jwt.verify(token, LINK_SECRET) as { email: string };
          
          if (!decoded.email || !decoded.email.endsWith("@iitp.ac.in")) {
            throw new Error("Access restricted to valid @iitp.ac.in domains.");
          }

          const email = decoded.email;
          
          // 2. Format a clean student username from their email structure
          // e.g., navin_prabhakar_2503ai02@iitp.ac.in -> "Navin Prabhakar"
          const [namePart] = email.split("@");
          const parts = namePart.split("_");
          const nameStr = parts.slice(0, -1).join(" ");
          const formattedName = nameStr
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          // Return the authenticated payload to construct the session cookie
          return {
            id: email,
            email: email,
            name: formattedName || namePart,
            image: null,
          };
        } catch (error) {
          console.error("❌ Token verification layer failed:", error);
          throw new Error("Your login link has expired or is invalid. Please request a new email.");
        }
      },
    }),
  ],
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days session persistence
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };