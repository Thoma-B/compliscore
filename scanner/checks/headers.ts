import type { CheckResult, CheckSeverity } from "@/scanner/types";

interface HeaderCheck {
  id: string;
  name: string;
  header: string;
  description: string;
  severity: CheckSeverity;
}

const HEADER_CHECKS: HeaderCheck[] = [
  {
    id: "hsts",
    name: "HSTS (Strict-Transport-Security)",
    header: "strict-transport-security",
    description: "Le serveur envoie l'en-tete Strict-Transport-Security pour forcer HTTPS",
    severity: "important",
  },
  {
    id: "csp",
    name: "CSP (Content-Security-Policy)",
    header: "content-security-policy",
    description: "Le serveur envoie l'en-tete Content-Security-Policy pour limiter les sources de contenu",
    severity: "important",
  },
  {
    id: "x-content-type",
    name: "X-Content-Type-Options",
    header: "x-content-type-options",
    description: "Le serveur envoie l'en-tete X-Content-Type-Options pour empecher le MIME sniffing",
    severity: "nice_to_have",
  },
  {
    id: "x-frame",
    name: "X-Frame-Options",
    header: "x-frame-options",
    description: "Le serveur envoie l'en-tete X-Frame-Options pour empecher le clickjacking",
    severity: "nice_to_have",
  },
  {
    id: "referrer-policy",
    name: "Referrer-Policy",
    header: "referrer-policy",
    description: "Le serveur envoie l'en-tete Referrer-Policy pour controler les informations de referrer",
    severity: "nice_to_have",
  },
];

export async function checkSecurityHeaders(
  headers: Headers,
): Promise<CheckResult[]> {
  return HEADER_CHECKS.map((check) => {
    const value = headers.get(check.header);

    return {
      id: check.id,
      name: check.name,
      description: check.description,
      category: "cyber" as const,
      severity: check.severity,
      status: value ? ("passed" as const) : ("failed" as const),
      details: value
        ? `Valeur : ${value}`
        : `En-tete ${check.header} absent`,
    };
  });
}
