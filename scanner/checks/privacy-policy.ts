import * as cheerio from "cheerio";
import type { CheckResult } from "@/scanner/types";

const HREF_KEYWORDS = [
  "politique-de-confidentialite",
  "privacy-policy",
  "privacy",
  "confidentialite",
  "donnees-personnelles",
  "personal-data",
  "politique-confidentialite",
  "vie-privee",
];

const TEXT_KEYWORDS = [
  "politique de confidentialité",
  "privacy policy",
  "données personnelles",
  "vie privée",
];

const BASE_RESULT = {
  id: "privacy-policy",
  name: "Politique de confidentialité",
  description:
    "Une politique de confidentialité accessible est obligatoire pour informer les utilisateurs du traitement de leurs données (Article 13 RGPD).",
  category: "rgpd" as const,
  severity: "critical" as const,
};

export function checkPrivacyPolicy(html: string): CheckResult {
  const $ = cheerio.load(html);

  const links = $("a[href]");

  for (const el of links) {
    const href = ($(el).attr("href") ?? "").toLowerCase();
    const text = $(el).text().toLowerCase().trim();

    for (const keyword of HREF_KEYWORDS) {
      if (href.includes(keyword)) {
        return {
          ...BASE_RESULT,
          status: "passed",
          details: `Lien detecte vers : ${href}`,
        };
      }
    }

    for (const keyword of TEXT_KEYWORDS) {
      if (text.includes(keyword)) {
        return {
          ...BASE_RESULT,
          status: "passed",
          details: `Lien detecte avec le texte : "${$(el).text().trim()}"`,
        };
      }
    }
  }

  return {
    ...BASE_RESULT,
    status: "failed",
    details:
      "Aucun lien vers une politique de confidentialite detecte sur la page",
  };
}
