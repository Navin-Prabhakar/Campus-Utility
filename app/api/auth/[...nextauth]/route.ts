import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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
          const email = await verifyActivationToken(token);
          
          if (!email) {
            throw new Error("Your login link has expired, is invalid, or was already used.");
          }

          const [namePart] = email.split("@");
          const parts = namePart.split("_");
          
          const nameStr = parts.length > 1 ? parts.slice(0, -1).join(" ") : namePart;
          const formattedName = nameStr
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          return {
            id: email, 
            email: email,
            name: formattedName || namePart,
            image: null, // Starts as null when first logging in
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
    maxAge: 30 * 24 * 60 * 60, 
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    // 🛠️ Updated to listen for the frontend calling update()
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image; // Capture the initial avatar state (null)
      }

      // If the frontend triggers a session sync with a new image link, update the token properties
      if (trigger === "update" && session?.user?.image) {
        token.picture = session.user.image;
      }

      return token;
    },
    // 🛠️ Updated to pass the dynamically altered token picture string down to the active UI state
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string | null; // Keeps your navbar and layout perfectly synced!
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };