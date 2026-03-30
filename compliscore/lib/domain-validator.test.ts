import { describe, it, expect } from "vitest";
import { validateDomain } from "@/lib/domain-validator";

describe("validateDomain", () => {
  describe("domaines valides", () => {
    it("accepte un domaine simple", () => {
      const result = validateDomain("example.com");
      expect(result).toEqual({ valid: true, domain: "example.com" });
    });

    it("supprime le protocole https", () => {
      const result = validateDomain("https://example.com");
      expect(result).toEqual({ valid: true, domain: "example.com" });
    });

    it("supprime le protocole http, le chemin et les parametres", () => {
      const result = validateDomain("http://www.example.com/path?q=1");
      expect(result).toEqual({ valid: true, domain: "www.example.com" });
    });

    it("convertit en minuscules", () => {
      const result = validateDomain("EXAMPLE.COM");
      expect(result).toEqual({ valid: true, domain: "example.com" });
    });

    it("supprime les espaces autour", () => {
      const result = validateDomain(" example.com ");
      expect(result).toEqual({ valid: true, domain: "example.com" });
    });
  });

  describe("domaines invalides", () => {
    it("rejette une chaine vide", () => {
      const result = validateDomain("");
      expect(result.valid).toBe(false);
      expect(result.domain).toBe("");
      expect(result.error).toBeDefined();
    });

    it("rejette un domaine avec des espaces", () => {
      const result = validateDomain("not valid");
      expect(result.valid).toBe(false);
      expect(result.domain).toBe("");
      expect(result.error).toBeDefined();
    });

    it("rejette un domaine sans extension", () => {
      const result = validateDomain("noextension");
      expect(result.valid).toBe(false);
      expect(result.domain).toBe("");
      expect(result.error).toBeDefined();
    });

    it("rejette un protocole sans domaine", () => {
      const result = validateDomain("https://");
      expect(result.valid).toBe(false);
      expect(result.domain).toBe("");
      expect(result.error).toBeDefined();
    });
  });
});
