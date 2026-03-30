const VALID_DOMAIN_CHARS = /^[a-z0-9.-]+$/;

export function validateDomain(input: string): {
  valid: boolean;
  domain: string;
  error?: string;
} {
  let cleaned = input.trim().toLowerCase();

  if (!cleaned) {
    return { valid: false, domain: "", error: "Le domaine ne peut pas etre vide" };
  }

  // Strip protocol
  cleaned = cleaned.replace(/^https?:\/\//, "");

  if (!cleaned) {
    return { valid: false, domain: "", error: "Le domaine ne peut pas etre vide" };
  }

  // Strip path, query string, fragment
  cleaned = cleaned.split("/")[0];
  cleaned = cleaned.split("?")[0];
  cleaned = cleaned.split("#")[0];

  // Strip trailing dot (valid in DNS but not useful here)
  cleaned = cleaned.replace(/\.$/, "");

  if (!cleaned) {
    return { valid: false, domain: "", error: "Le domaine ne peut pas etre vide" };
  }

  // Check for spaces
  if (cleaned.includes(" ")) {
    return {
      valid: false,
      domain: "",
      error: "Le domaine ne doit pas contenir d'espaces",
    };
  }

  // Check valid characters
  if (!VALID_DOMAIN_CHARS.test(cleaned)) {
    return {
      valid: false,
      domain: "",
      error: "Le domaine contient des caracteres invalides",
    };
  }

  // Must have at least one dot
  if (!cleaned.includes(".")) {
    return {
      valid: false,
      domain: "",
      error: "Le domaine doit contenir au moins une extension (ex: .com, .fr)",
    };
  }

  return { valid: true, domain: cleaned };
}
