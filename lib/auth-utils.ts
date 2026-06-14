import jwt from "jsonwebtoken";

const LINK_SECRET = process.env.NEXTAUTH_SECRET || "fallback_secret";
const LINK_TTL_MS = 15 * 60 * 1000; // Link expires in 15 minutes

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates that the input matches the strict format:
 * name_rollnumber@iitp.ac.in (e.g., navin_2503ai02@iitp.ac.in)
 */
export function validateIitpEmail(email: string): boolean {
  return /^[a-zA-Z0-9._]+_[a-z0-9]+@iitp\.ac\.in$/.test(normalizeEmail(email));
}

/**
 * Generates a secure, cryptographically signed token containing the user's email
 */
export function generateActivationToken(email: string): string {
  const normalized = normalizeEmail(email);
  
  // Sign the email into a secure JSON Web Token expiring in 15 minutes
  return jwt.sign({ email: normalized }, LINK_SECRET, { expiresIn: "15m" });
}

/**
 * Verifies that the activation token is authentic and has not expired
 */
export function verifyActivationToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, LINK_SECRET) as { email: string };
    
    if (decoded.email && decoded.email.endsWith("@iitp.ac.in")) {
      return decoded.email;
    }
    return null;
  } catch (error) {
    console.error("❌ Token authentication validation failed:", error);
    return null;
  }
}