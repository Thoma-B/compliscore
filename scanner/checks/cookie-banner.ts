import * as cheerio from "cheerio";
import type { CheckResult } from "@/scanner/types";

const CONSENT_SCRIPTS = [
  "tarteaucitron",
  "axeptio",
  "cookiebot",
  "onetrust",
  "didomi",
  "quantcast",
  "osano",
  "cookie-consent",
];

const CONSENT_SELECTORS = [
  "#cookie-banner",
  "#cookie-consent",
  "#gdpr-banner",
  "#cookie-notice",
  "#consent-banner",
  "#tarteaucitron",
  ".cookie-banner",
  ".cookie-consent",
  ".gdpr-banner",
  ".cookie-notice",
  ".consent-banner",
  ".tarteaucitron",
  "[data-cookieconsent]",
  "[data-gdpr]",
];

const BASE_RESULT = {
  id: "cookie-banner",
  name: "Bannière de cookies détectée",
  description:
    "Une bannière de consentement aux cookies est obligatoire pour tout site utilisant des cookies non essentiels (RGPD).",
  category: "rgpd" as const,
  severity: "critical" as const,
};

export function checkCookieBanner(html: string): CheckResult {
  const $ = cheerio.load(html);

  // Check script sources for known consent management platforms
  const scripts = $("script[src]")
    .map((_, el) => $(el).attr("src")?.toLowerCase() ?? "")
    .get();

  for (const src of scripts) {
    for (const keyword of CONSENT_SCRIPTS) {
      if (src.includes(keyword)) {
        return {
          ...BASE_RESULT,
          status: "passed",
          details: `Script de consentement detecte : ${keyword}`,
        };
      }
    }
  }

  // Check for known consent elements by ID, class, or data attributes
  for (const selector of CONSENT_SELECTORS) {
    if ($(selector).length > 0) {
      return {
        ...BASE_RESULT,
        status: "passed",
        details: `Element de consentement detecte : ${selector}`,
      };
    }
  }

  return {
    ...BASE_RESULT,
    status: "failed",
    details:
      "Aucune banniere de consentement aux cookies detectee sur la page",
  };
}
