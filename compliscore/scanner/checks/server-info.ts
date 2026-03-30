import type { CheckResult } from "@/scanner/types";

const VERSION_PATTERN = /\d+\.\d+/;

export async function checkServerInfo(
  headers: Headers,
): Promise<CheckResult> {
  const server = headers.get("server");

  if (!server) {
    return {
      id: "server-info",
      name: "Exposition d'informations serveur",
      description:
        "Le serveur ne divulgue pas de version dans l'en-tete Server",
      category: "cyber",
      severity: "nice_to_have",
      status: "passed",
      details: "En-tete Server absent",
    };
  }

  if (VERSION_PATTERN.test(server)) {
    return {
      id: "server-info",
      name: "Exposition d'informations serveur",
      description:
        "Le serveur ne divulgue pas de version dans l'en-tete Server",
      category: "cyber",
      severity: "nice_to_have",
      status: "failed",
      details: `Version serveur exposee : ${server}`,
    };
  }

  return {
    id: "server-info",
    name: "Exposition d'informations serveur",
    description:
      "Le serveur ne divulgue pas de version dans l'en-tete Server",
    category: "cyber",
    severity: "nice_to_have",
    status: "passed",
    details: `En-tete Server generique : ${server}`,
  };
}
