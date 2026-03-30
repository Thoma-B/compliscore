import * as cheerio from "cheerio";
import type { CheckResult } from "@/scanner/types";

interface TrackerPattern {
  name: string;
  patterns: RegExp[];
}

const TRACKER_DEFINITIONS: TrackerPattern[] = [
  {
    name: "Google Analytics",
    patterns: [
      /gtag\s*\(/,
      /google-analytics\.com/,
      /googletagmanager\.com\/gtag/,
      /\bga\.js\b/,
      /\banalytics\.js\b/,
      /\bG-[A-Z0-9]+\b/,
    ],
  },
  {
    name: "Google Tag Manager",
    patterns: [/googletagmanager\.com\/gtm\.js/],
  },
  {
    name: "Facebook Pixel",
    patterns: [/\bfbq\s*\(/, /facebook\s*pixel/i, /connect\.facebook\.net/],
  },
  {
    name: "Hotjar",
    patterns: [/hotjar/i],
  },
  {
    name: "Segment",
    patterns: [/cdn\.segment\.com|analytics\.segment\./],
  },
  {
    name: "Mixpanel",
    patterns: [/mixpanel/i],
  },
  {
    name: "Amplitude",
    patterns: [/amplitude/i],
  },
  {
    name: "Heap",
    patterns: [/heap\s*\.\s*load|heapanalytics/i],
  },
];

const BASE_RESULT = {
  id: "trackers",
  name: "Traceurs tiers détectés",
  description:
    "Les traceurs tiers (analytics, pixels publicitaires) nécessitent le consentement explicite de l'utilisateur avant activation (RGPD + directive ePrivacy).",
  category: "rgpd" as const,
  severity: "important" as const,
};

export function checkTrackers(html: string): CheckResult {
  const $ = cheerio.load(html);

  // Collect all script content (inline + src attributes)
  const scriptContents: string[] = [];
  $("script").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    const inline = $(el).html() ?? "";
    scriptContents.push(src, inline);
  });

  // Also check noscript and img tags (tracking pixels)
  $("noscript").each((_, el) => {
    scriptContents.push($(el).html() ?? "");
  });
  $("img[src]").each((_, el) => {
    scriptContents.push($(el).attr("src") ?? "");
  });

  const fullText = scriptContents.join("\n");
  const detected: string[] = [];

  for (const tracker of TRACKER_DEFINITIONS) {
    for (const pattern of tracker.patterns) {
      if (pattern.test(fullText)) {
        detected.push(tracker.name);
        break;
      }
    }
  }

  if (detected.length > 0) {
    return {
      ...BASE_RESULT,
      status: "warning",
      details: `Traceurs detectes : ${detected.join(", ")}`,
    };
  }

  return {
    ...BASE_RESULT,
    status: "passed",
    details: "Aucun traceur tiers detecte sur la page",
  };
}
