export interface StudentProfile {
  yearGroup: "Freshers" | "Sophomores" | "Juniors" | "Seniors" | "Unknown";
  branch: string;
}

export function parseStudentEmail(email: string | null | undefined): StudentProfile {
  if (!email || !email.includes("@iitp.ac.in")) {
    return { yearGroup: "Unknown", branch: "" };
  }

  // Extract the part before @iitp.ac.in
  const localPart = email.split("@")[0]; // e.g., "hiten_2503ai02"
  
  // Find the roll number string using regex (looks for 4 digits followed by 2 letters and 2 digits)
  const rollMatch = localPart.match(/(\d{2})(\d{2})([a-zA-Z]{2})(\d{2})/);
  
  if (!rollMatch) {
    return { yearGroup: "Unknown", branch: "" };
  }

  const [_, entryYear, courseCode, branchCode] = rollMatch;
  const branch = branchCode.toUpperCase(); // e.g., "AI", "CS", "EE"

  // Calculate year group based on current year (2026)
  let yearGroup: StudentProfile["yearGroup"] = "Unknown";
  if (entryYear === "26") yearGroup = "Freshers";
  else if (entryYear === "25") yearGroup = "Sophomores";
  else if (entryYear === "24") yearGroup = "Juniors";
  else if (entryYear === "23") yearGroup = "Seniors";

  return { yearGroup, branch };
}