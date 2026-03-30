import { resolveTxt } from "node:dns/promises";
import type { CheckResult } from "@/scanner/types";

async function queryTxt(domain: string): Promise<string[][]> {
  try {
    return await resolveTxt(domain);
  } catch {
    return [];
  }
}

function hasTxtMatch(records: string[][], pattern: string): boolean {
  return records.some((chunks) =>
    chunks.join("").toLowerCase().includes(pattern.toLowerCase()),
  );
}

export async function checkDnsEmail(
  domain: string,
): Promise<CheckResult[]> {
  const [spfRecords, dmarcRecords, dkimRecords] = await Promise.all([
    queryTxt(domain),
    queryTxt(`_dmarc.${domain}`),
    queryTxt(`default._domainkey.${domain}`),
  ]);

  const spfFound = hasTxtMatch(spfRecords, "v=spf1");
  const dmarcFound = hasTxtMatch(dmarcRecords, "v=DMARC1");
  const dkimFound =
    hasTxtMatch(dkimRecords, "v=DKIM1") ||
    hasTxtMatch(dkimRecords, "k=rsa");

  const spf: CheckResult = {
    id: "spf",
    name: "SPF configuré",
    description:
      "Le protocole SPF protège contre l'usurpation d'email en vérifiant les serveurs autorisés à envoyer des emails pour votre domaine.",
    category: "cyber",
    severity: "important",
    status: spfFound ? "passed" : "failed",
  };

  const dmarc: CheckResult = {
    id: "dmarc",
    name: "DMARC configuré",
    description:
      "DMARC empêche l'usurpation de votre domaine email et définit la politique de traitement des emails non authentifiés.",
    category: "cyber",
    severity: "important",
    status: dmarcFound ? "passed" : "failed",
  };

  const dkim: CheckResult = {
    id: "dkim",
    name: "DKIM configuré",
    description:
      "DKIM signe cryptographiquement vos emails pour garantir leur authenticité et intégrité.",
    category: "cyber",
    severity: "nice_to_have",
    status: dkimFound ? "passed" : "warning",
  };

  return [spf, dmarc, dkim];
}
