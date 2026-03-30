import type { CheckResult } from "@/scanner/types";

export async function checkHttps(domain: string): Promise<CheckResult> {
  try {
    await fetch(`https://${domain}`, {
      signal: AbortSignal.timeout(10_000),
      redirect: "follow",
    });

    return {
      id: "https",
      name: "HTTPS actif",
      description: "Le site est accessible en HTTPS",
      category: "cyber",
      severity: "critical",
      status: "passed",
    };
  } catch {
    return {
      id: "https",
      name: "HTTPS actif",
      description: "Le site est accessible en HTTPS",
      category: "cyber",
      severity: "critical",
      status: "failed",
      details: "Impossible de se connecter au site en HTTPS",
    };
  }
}
