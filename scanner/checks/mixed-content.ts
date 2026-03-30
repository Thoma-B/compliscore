import * as cheerio from "cheerio";
import type { CheckResult } from "@/scanner/types";

const TAGS_WITH_SRC = ["img", "script", "iframe"];
const TAGS_WITH_HREF = ["link"];

export async function checkMixedContent(html: string): Promise<CheckResult> {
  const $ = cheerio.load(html);
  const insecureUrls: string[] = [];

  for (const tag of TAGS_WITH_SRC) {
    $(tag).each((_, el) => {
      const src = $(el).attr("src");
      if (src?.startsWith("http://")) {
        insecureUrls.push(`<${tag} src="${src}">`);
      }
    });
  }

  for (const tag of TAGS_WITH_HREF) {
    $(tag).each((_, el) => {
      const href = $(el).attr("href");
      if (href?.startsWith("http://")) {
        insecureUrls.push(`<${tag} href="${href}">`);
      }
    });
  }

  if (insecureUrls.length > 0) {
    return {
      id: "mixed-content",
      name: "Contenu mixte (HTTP/HTTPS)",
      description:
        "La page ne charge pas de ressources en HTTP non securise",
      category: "cyber",
      severity: "nice_to_have",
      status: "failed",
      details: `${insecureUrls.length} ressource(s) chargee(s) en HTTP : ${insecureUrls.join(", ")}`,
    };
  }

  return {
    id: "mixed-content",
    name: "Contenu mixte (HTTP/HTTPS)",
    description:
      "La page ne charge pas de ressources en HTTP non securise",
    category: "cyber",
    severity: "nice_to_have",
    status: "passed",
  };
}
