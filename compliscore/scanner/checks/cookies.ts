import type { CheckResult } from "@/scanner/types";

export async function checkCookieFlags(
  headers: Headers,
): Promise<CheckResult> {
  const setCookieHeader = headers.getSetCookie?.() ?? [];

  if (setCookieHeader.length === 0) {
    return {
      id: "cookie-flags",
      name: "Drapeaux de securite des cookies",
      description:
        "Les cookies du site utilisent les drapeaux Secure, HttpOnly et SameSite",
      category: "cyber",
      severity: "important",
      status: "passed",
      details: "Aucun cookie detecte",
    };
  }

  let totalCookies = 0;
  let secureCookies = 0;

  for (const cookie of setCookieHeader) {
    totalCookies++;
    const lower = cookie.toLowerCase();
    const hasSecure = lower.includes("secure");
    const hasHttpOnly = lower.includes("httponly");
    const hasSameSite = lower.includes("samesite");

    if (hasSecure && hasHttpOnly && hasSameSite) {
      secureCookies++;
    }
  }

  if (secureCookies === totalCookies) {
    return {
      id: "cookie-flags",
      name: "Drapeaux de securite des cookies",
      description:
        "Les cookies du site utilisent les drapeaux Secure, HttpOnly et SameSite",
      category: "cyber",
      severity: "important",
      status: "passed",
      details: `${totalCookies} cookie(s) avec tous les drapeaux de securite`,
    };
  }

  if (secureCookies === 0) {
    return {
      id: "cookie-flags",
      name: "Drapeaux de securite des cookies",
      description:
        "Les cookies du site utilisent les drapeaux Secure, HttpOnly et SameSite",
      category: "cyber",
      severity: "important",
      status: "failed",
      details: `Aucun des ${totalCookies} cookie(s) ne possede tous les drapeaux de securite`,
    };
  }

  return {
    id: "cookie-flags",
    name: "Drapeaux de securite des cookies",
    description:
      "Les cookies du site utilisent les drapeaux Secure, HttpOnly et SameSite",
    category: "cyber",
    severity: "important",
    status: "warning",
    details: `${secureCookies}/${totalCookies} cookie(s) avec tous les drapeaux de securite`,
  };
}
