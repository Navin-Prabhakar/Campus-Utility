import jwt from "jsonwebtoken";

const LINK_SECRET = process.env.NEXTAUTH_SECRET || "fallback_secret";

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
 * Generates a secure, cryptographically signed token containing the user's email.
 * This token is stateless and remains valid for exactly 10 minutes.
 */
export function generateActivationToken(email: string): string {
  const normalized = normalizeEmail(email);
  
  // ⏱️ Strictly expires in 10 minutes. Can be verified multiple times during this window.
  return jwt.sign({ email: normalized }, LINK_SECRET, { expiresIn: "10m" });
}

/**
 * Verifies that the activation token is authentic and has not passed its 10-minute expiry window.
 */
export function verifyActivationToken(token: string): string | null {
  try {
    // Cryptographically checks if the signature is authentic and validation window is active
    const decoded = jwt.verify(token, LINK_SECRET) as { email: string };
    
    if (decoded.email && decoded.email.endsWith("@iitp.ac.in")) {
      return normalizeEmail(decoded.email);
    }
    return null;
  } catch (error) {
    // jwt.verify automatically throws an error if the 10-minute window has expired
    console.error("❌ Token verification layer failed or window expired:", error);
    return null;
  } 
}