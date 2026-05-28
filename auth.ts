import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { validateIitpEmail, verifyOtp } from "@/lib/otp";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "IIT Patna Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "name_rollnumber@iitp.ac.in" },
        otp: { label: "OTP", type: "text", placeholder: "123456" },
        otpToken: { label: "OTP Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("Email is required");
        }

        if (!credentials?.otp) {
          throw new Error("OTP is required");
        }

        if (!credentials?.otpToken) {
          throw new Error("Please request a new OTP.");
        }

        const email = credentials.email as string;
        const otp = credentials.otp as string;
        const otpToken = credentials.otpToken as string;

        if (!validateIitpEmail(email)) {
          throw new Error(
            "Please use your IIT Patna email (name_rollNumber@iitp.ac.in, where rollNumber can contain digits and lowercase letters)"
          );
        }

        if (!verifyOtp(email, otp, otpToken)) {
          throw new Error("Invalid or expired OTP. Please request a new code.");
        }

        const [namePart] = email.split("@");
        const parts = namePart.split("_");
        const nameStr = parts.slice(0, -1).join("_").replace(/_/g, " ");

        return {
          id: email,
          email: email,
          name: nameStr.charAt(0).toUpperCase() + nameStr.slice(1),
          image: null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  session: {
    maxAge: 30 * 24 * 60 * 60,
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
};
