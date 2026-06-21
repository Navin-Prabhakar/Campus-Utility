import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// 1. Import your custom stateful verification function instead of raw jsonwebtoken
import { verifyActivationToken } from "@/lib/auth-utils"; 

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
          // 2. Run the secure check: structural verification + DB token destruction
          const email = await verifyActivationToken(token);
          
          if (!email) {
            throw new Error("Your login link has expired, is invalid, or was already used.");
          }

          // 3. Format a clean student username from their email structure
          // e.g., navin_prabhakar_2503ai02@iitp.ac.in -> "Navin Prabhakar"
          const [namePart] = email.split("@");
          const parts = namePart.split("_");
          
          // Safeguard to ensure there are underscores present before slicing the roll number
          const nameStr = parts.length > 1 ? parts.slice(0, -1).join(" ") : namePart;
          const formattedName = nameStr
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          // Return the authenticated payload to construct the session cookie
          return {
            id: email, // Maps email as the unique identifier string
            email: email,
            name: formattedName || namePart,
            image: null,
          };
        } catch (error: any) {
          console.error("❌ Token verification layer failed:", error);
          throw new Error(
            error.message || "Your login link has expired or is invalid. Please request a new email."
          );
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