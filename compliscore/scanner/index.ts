import type { ScanResult, CheckResult } from "@/scanner/types";
import { calculateScore } from "@/scanner/scoring";
import { checkSecurityHeaders } from "@/scanner/checks/headers";
import { checkCookieFlags } from "@/scanner/checks/cookies";
import { checkServerInfo } from "@/scanner/checks/server-info";
import { checkMixedContent } from "@/scanner/checks/mixed-content";
import { checkDnsEmail } from "@/scanner/checks/dns-email";
import { checkCookieBanner } from "@/scanner/checks/cookie-banner";
import { checkPrivacyPolicy } from "@/scanner/checks/privacy-policy";
import { checkLegalNotices } from "@/scanner/checks/legal-notices";
import { checkTrackers } from "@/scanner/checks/trackers";

async function fetchPage(
  domain: string,
): Promise<{ response: Response; usedHttps: boolean } | null> {
  // Try HTTPS first
  try {
    const response = await fetch(`https://${domain}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    return { response, usedHttps: true };
  } catch {
    // HTTPS failed, try HTTP fallback
  }

  try {
    const response = await fetch(`http://${domain}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    return { response, usedHttps: false };
  } catch {
    return null;
  }
}

function httpsCheckResult(usedHttps: boolean): CheckResult {
  return {
    id: "https",
    name: "HTTPS actif",
    description: "Le site est accessible en HTTPS",
    category: "cyber",
    severity: "critical",
    status: usedHttps ? "passed" : "failed",
    details: usedHttps
      ? undefined
      : "Impossible de se connecter au site en HTTPS",
  };
}

function failedHttpChecks(): CheckResult[] {
  return [
    {
      id: "https",
      name: "HTTPS actif",
      description: "Le site est accessible en HTTPS",
      category: "cyber",
      severity: "critical",
      status: "failed",
      details: "Impossible de se connecter au site",
    },
    {
      id: "hsts",
      name: "HSTS (Strict-Transport-Security)",
      description:
        "Le serveur envoie l'en-tete Strict-Transport-Security pour forcer HTTPS",
      category: "cyber",
      severity: "important",
      status: "failed",
      details: "Impossible de verifier (site inaccessible)",
    },
    {
      id: "csp",
      name: "CSP (Content-Security-Policy)",
      description:
        "Le serveur envoie l'en-tete Content-Security-Policy pour limiter les sources de contenu",
      category: "cyber",
      severity: "important",
      status: "failed",
      details: "Impossible de verifier (site inaccessible)",
    },
    {
      id: "x-content-type",
      name: "X-Content-Type-Options",
      description:
        "Le serveur envoie l'en-tete X-Content-Type-Options pour empecher le MIME sniffing",
      category: "cyber",
      severity: "nice_to_have",
      status: "failed",
      details: "Impossible de verifier (site inaccessible)",
    },
    {
      id: "x-frame",
      name: "X-Frame-Options",
      description:
        "Le serveur envoie l'en-tete X-Frame-Options pour empecher le clickjacking",
      category: "cyber",
      severity: "nice_to_have",
      status: "failed",
      details: "Impossible de verifier (site inaccessible)",
    },
    {
      id: "referrer-policy",
      name: "Referrer-Policy",
      description:
        "Le serveur envoie l'en-tete Referrer-Policy pour controler les informations de referrer",
      category: "cyber",
      severity: "nice_to_have",
      status: "failed",
      details: "Impossible de verifier (site inaccessible)",
    },
    {
      id: "cookie-flags",
      name: "Drapeaux de securite des cookies",
      description:
        "Les cookies du site utilisent les drapeaux Secure, HttpOnly et SameSite",
      category: "cyber",
      severity: "important",
      status: "failed",
      details: "Impossible de verifier (site inaccessible)",
    },
    {
      id: "server-info",
      name: "Exposition d'informations serveur",
      description:
        "Le serveur ne divulgue pas de version dans l'en-tete Server",
      category: "cyber",
      severity: "nice_to_have",
      status: "failed",
      details: "Impossible de verifier (site inaccessible)",
    },
    {
      id: "mixed-content",
      name: "Contenu mixte (HTTP/HTTPS)",
      description:
        "La page ne charge pas de ressources en HTTP non securise",
      category: "cyber",
      severity: "nice_to_have",
      status: "failed",
      details: "Impossible de verifier (site inaccessible)",
    },
    {
      id: "cookie-banner",
      name: "Banniere de cookies detectee",
      description:
        "Une banniere de consentement aux cookies est obligatoire pour tout site utilisant des cookies non essentiels (RGPD).",
      category: "rgpd",
      severity: "critical",
      status: "failed",
      details: "Impossible de verifier (site inaccessible)",
    },
    {
      id: "privacy-policy",
      name: "Politique de confidentialite",
      description:
        "Une politique de confidentialite accessible est obligatoire pour informer les utilisateurs du traitement de leurs donnees (Article 13 RGPD).",
      category: "rgpd",
      severity: "critical",
      status: "failed",
      details: "Impossible de verifier (site inaccessible)",
    },
    {
      id: "legal-notices",
      name: "Mentions legales",
      description:
        "Les mentions legales sont obligatoires pour tout site web professionnel en France (Article 6 de la LCEN).",
      category: "rgpd",
      severity: "important",
      status: "failed",
      details: "Impossible de verifier (site inaccessible)",
    },
    {
      id: "trackers",
      name: "Traceurs tiers detectes",
      description:
        "Les traceurs tiers (analytics, pixels publicitaires) necessitent le consentement explicite de l'utilisateur avant activation (RGPD + directive ePrivacy).",
      category: "rgpd",
      severity: "important",
      status: "failed",
      details: "Impossible de verifier (site inaccessible)",
    },
  ];
}

export async function runScan(domain: string): Promise<ScanResult> {
  const checks: CheckResult[] = [];

  // Run DNS checks in parallel with HTTP fetch
  const [fetchResult, dnsResults] = await Promise.all([
    fetchPage(domain),
    checkDnsEmail(domain),
  ]);

  if (fetchResult) {
    const { response, usedHttps } = fetchResult;

    // HTTPS check result
    checks.push(httpsCheckResult(usedHttps));

    // Header-dependent checks (run in parallel)
    const [headerChecks, cookieCheck, serverInfoCheck] = await Promise.all([
      checkSecurityHeaders(response.headers),
      checkCookieFlags(response.headers),
      checkServerInfo(response.headers),
    ]);
    checks.push(...headerChecks, cookieCheck, serverInfoCheck);

    // HTML-dependent checks
    const html = await response.text();
    const [mixedContent, cookieBanner, privacyPolicy, legalNotices, trackers] =
      await Promise.all([
        checkMixedContent(html),
        Promise.resolve(checkCookieBanner(html)),
        Promise.resolve(checkPrivacyPolicy(html)),
        Promise.resolve(checkLegalNotices(html)),
        Promise.resolve(checkTrackers(html)),
      ]);
    checks.push(mixedContent, cookieBanner, privacyPolicy, legalNotices, trackers);
  } else {
    // Both HTTP and HTTPS failed
    checks.push(...failedHttpChecks());
  }

  // Add DNS results
  checks.push(...dnsResults);

  const score = calculateScore(checks);

  return {
    id: crypto.randomUUID(),
    domain,
    checks,
    score,
    scannedAt: new Date().toISOString(),
  };
}
