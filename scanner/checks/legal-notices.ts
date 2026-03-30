import * as cheerio from "cheerio";
import type { CheckResult } from "@/scanner/types";

const HREF_KEYWORDS = [
  "mentions-legales",
  "mentions-obligatoires",
  "legal-notice",
  "legal",
  "imprint",
];

const TEXT_KEYWORDS = ["mentions légales", "legal notice"];

const BASE_RESULT = {
  id: "legal-notices",
  name: "Mentions légales",
  description:
    "Les mentions légales sont obligatoires pour tout site web professionnel en France (Article 6 de la LCEN).",
  category: "rgpd" as const,
  severity: "important" as const,
};

export function checkLegalNotices(html: string): CheckResult {
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
    details: "Aucun lien vers les mentions legales detecte sur la page",
  };
}
