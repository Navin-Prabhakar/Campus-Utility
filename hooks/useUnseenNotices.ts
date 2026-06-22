"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Papa from "papaparse";
import { parseStudentEmail } from "../utils/rollParser";

const GIDS = {
  UNIVERSAL: "0",
  FRESHERS: "621207693",
  SOPHOMORES: "2119507775",
  JUNIORS: "1930386959",
  SENIORS: "1844437553",
};

const SEEN_NOTICES_KEY = "iitp_seen_notice_ids";

export function useUnseenNotices(modalOpen: boolean) {
  const { data: session } = useSession();
  const [unseenCount, setUnseenCount] = useState<number>(0);

  useEffect(() => {
    // If modal is currently open, we keep count at 0 (handled by modal marking them seen)
    if (modalOpen) {
      setUnseenCount(0);
      return;
    }

    async function checkNewNotices() {
      if (!session?.user?.email) return;

      try {
        const profile = parseStudentEmail(session.user.email);
        
        // Retrieve list of IDs the user has already seen
        const seenIdsStr = localStorage.getItem(SEEN_NOTICES_KEY);
        const seenIds: string[] = seenIdsStr ? JSON.parse(seenIdsStr) : [];

        const baseUrl = "https://docs.google.com/spreadsheets/d/1o3ZTVhnP9_xjzkEtMmKd6JFh-cznagwsCTIAAlAFBZ0/export?format=csv&gid=";
        const urlsToFetch = [{ url: `${baseUrl}${GIDS.UNIVERSAL}`, type: "universal" }];

        if (profile.yearGroup === "Freshers") urlsToFetch.push({ url: `${baseUrl}${GIDS.FRESHERS}`, type: "freshers" });
        if (profile.yearGroup === "Sophomores") urlsToFetch.push({ url: `${baseUrl}${GIDS.SOPHOMORES}`, type: "batch" });
        if (profile.yearGroup === "Juniors") urlsToFetch.push({ url: `${baseUrl}${GIDS.JUNIORS}`, type: "batch" });
        if (profile.yearGroup === "Seniors") urlsToFetch.push({ url: `${baseUrl}${GIDS.SENIORS}`, type: "batch" });

        let freshNoticeCounter = 0;

        await Promise.all(
          urlsToFetch.map(async ({ url, type }) => {
            try {
              const res = await fetch(url);
              const rawText = await res.text();
              const lines = rawText.split("\n");
              const cleanCsvText = lines.slice(1).join("\n");

              return new Promise<void>((resolve) => {
                Papa.parse(cleanCsvText, {
                  header: true,
                  skipEmptyLines: true,
                  complete: (results) => {
                    const rows = results.data as any[];
                    rows.forEach((row) => {
                      const title = (row["Title"] || row["Tittle"] || row["title"] || "").trim();
                      const description = (row["Description"] || row["description"] || "").trim();
                      if (!title && !description) return;

                      const targetBranchText = (row["Target Branch"] || row["Target Audience"] || "").trim().toUpperCase();
                      const isUniversal = type === "universal";
                      const isFresherOverride = type === "freshers";
                      const isBatchWideOverride = targetBranchText === `ALL ${profile.yearGroup.toUpperCase()}`;
                      const userBranch = (profile.branch || "").toUpperCase();

                      const isTargetedBranchMatch = 
                        targetBranchText === "ALL" || 
                        targetBranchText === "" || 
                        isBatchWideOverride ||
                        targetBranchText.split(/[\s,]+/).some((b: string) => b.trim() === userBranch);

                      if (isUniversal || isFresherOverride || isTargetedBranchMatch) {
                        const dateStr = (row["Date (dd/mm/yyyy)"] || row["Date"] || "").trim();
                        const authorStr = (row["Author"] || row["author"] || "Admin").trim();
                        
                        // Generate a unique fingerprint ID for this notice entry
                        const noticeId = `${title}_${dateStr}_${authorStr}`.replace(/\s+/g, "_");

                        // If this ID is missing from our seen list, increment counter
                        if (!seenIds.includes(noticeId)) {
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
              console.error(`Failed loading badge counter stream: ${url}`, fetchErr);
            }
          })
        );

        setUnseenCount(freshNoticeCounter);
      } catch (err) {
        console.error("Failed to parse notifications badge metrics:", err);
      }
    }

    checkNewNotices();
    const interval = setInterval(checkNewNotices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session, modalOpen]);

  return unseenCount;
}