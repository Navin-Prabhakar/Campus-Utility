"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Papa from "papaparse";
import { parseStudentEmail } from "../utils/rollParser";

// 🌐 Your configured active numeric Google Sheet tab GIDs
const GIDS = {
  UNIVERSAL: "0",
  FRESHERS: "621207693",
  SOPHOMORES: "2119507775",
  JUNIORS: "1930386959",
  SENIORS: "1844437553",
};

const LAST_VIEWED_KEY = "iitp_last_viewed_notices";

export function useUnseenNotices(modalOpen: boolean) {
  const { data: session } = useSession();
  const [unseenCount, setUnseenCount] = useState<number>(0);

  useEffect(() => {
    // If the modal is opened, clear the count by updating the last viewed timestamp
    if (modalOpen) {
      localStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString());
      setUnseenCount(0);
      return;
    }

    async function checkNewNotices() {
      if (!session?.user?.email) return;

      try {
        const profile = parseStudentEmail(session.user.email);
        const lastViewedStr = localStorage.getItem(LAST_VIEWED_KEY);
        // Fallback to a past date if they've never opened it
        const lastViewedTime = lastViewedStr ? new Date(lastViewedStr).getTime() : 0;

        const baseUrl = "https://docs.google.com/spreadsheets/d/1o3ZTVhnP9_xjzkEtMmKd6JFh-cznagwsCTIAAlAFBZ0/export?format=csv&gid=";

        // 1. Build the dynamic array of targets to pull down based on user batch
        const urlsToFetch = [
          `${baseUrl}${GIDS.UNIVERSAL}` // Always fetch Universal Notices
        ];

        // 🛠️ Dynamically injects the correct branch sheets matching the profile year group
        if (profile.yearGroup === "Freshers") urlsToFetch.push(`${baseUrl}${GIDS.FRESHERS}`);
        if (profile.yearGroup === "Sophomores") urlsToFetch.push(`${baseUrl}${GIDS.SOPHOMORES}`);
        if (profile.yearGroup === "Juniors") urlsToFetch.push(`${baseUrl}${GIDS.JUNIORS}`);
        if (profile.yearGroup === "Seniors") urlsToFetch.push(`${baseUrl}${GIDS.SENIORS}`);

        let freshNoticeCounter = 0;

        await Promise.all(
          urlsToFetch.map(async (url) => {
            try {
              const res = await fetch(url);
              const rawText = await res.text();

              // 🛠️ THE FIX: Split raw CSV string by lines and remove the decorative row 1
              const lines = rawText.split("\n");
              const cleanCsvText = lines.slice(1).join("\n"); // Row 2 now sets structural keys

              return new Promise<void>((resolve) => {
                Papa.parse(cleanCsvText, {
                  header: true,
                  skipEmptyLines: true,
                  complete: (results) => {
                    const rows = results.data as any[];
                    rows.forEach((row) => {
                      // Normalize column reads supporting exact column headers on Row 2
                      const targetBranch = (
                        row["Target Branch"] || 
                        row["Target Audience"] || 
                        row["target audience"] || 
                        ""
                      ).trim().toUpperCase();
                      
                      // Match the branch profile parameters strictly
                      if (targetBranch === "ALL" || targetBranch === "" || targetBranch === profile.branch) {
                        
                        // Parse notice row timestamp string safely
                        const dateStr = row["Date (dd/mm/yyyy)"] || row["date"] || ""; 
                        const noticeTime = Date.parse(dateStr) || 0;

                        // If the notice timestamp is newer than the last viewed mark, count it
                        if (noticeTime > lastViewedTime) {
                          freshNoticeCounter++;
                        }
                      }
                    });
                    resolve();
                  },
                  error: () => resolve(),
                });
              });
            } catch (fetchErr) {
              console.error(`Failed loading count stream branch link: ${url}`, fetchErr);
            }
          })
        );

        setUnseenCount(freshNoticeCounter);
      } catch (err) {
        console.error("Failed to parse notifications badge metrics:", err);
      }
    }

    // Run immediately on layout frame mount
    checkNewNotices();
    
    // Check for updates every 5 minutes automatically
    const interval = setInterval(checkNewNotices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session, modalOpen]);

  return unseenCount;
}