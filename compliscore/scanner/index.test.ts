import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockResolveTxt } = vi.hoisted(() => ({
  mockResolveTxt: vi.fn(),
}));

vi.mock("node:dns/promises", () => ({
  default: { resolveTxt: mockResolveTxt },
  resolveTxt: mockResolveTxt,
}));

import { runScan } from "@/scanner/index";

function makeResponse(
  body: string,
  headers: Record<string, string> = {},
): Response {
  const h = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    h.set(key, value);
  }
  return new Response(body, { status: 200, headers: h });
}

const GOOD_HEADERS: Record<string, string> = {
  "strict-transport-security": "max-age=31536000",
  "content-security-policy": "default-src 'self'",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
};

const GOOD_HTML = `<!DOCTYPE html>
<html><head><title>Test</title></head>
<body>
  <script src="https://cdn.example.com/tarteaucitron.js"></script>
  <a href="/politique-de-confidentialite">Politique de confidentialite</a>
  <a href="/mentions-legales">Mentions legales</a>
</body></html>`;

const MINIMAL_HTML = `<!DOCTYPE html><html><body><p>Hello</p></body></html>`;

describe("runScan", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    mockResolveTxt.mockReset();
    mockResolveTxt.mockResolvedValue([]);
  });

  it("retourne un resultat complet pour un scan reussi", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse(GOOD_HTML, GOOD_HEADERS)),
    );

    const result = await runScan("example.com");

    expect(result.id).toBeDefined();
    expect(result.domain).toBe("example.com");
    expect(result.scannedAt).toBeDefined();
    expect(result.checks).toBeInstanceOf(Array);
    expect(result.checks.length).toBeGreaterThan(0);
    expect(result.score).toBeDefined();
    expect(result.score.total).toBeGreaterThanOrEqual(0);
    expect(result.score.total).toBeLessThanOrEqual(100);
    expect(result.score.grade).toMatch(/^[A-DF]$/);
  });

  it("utilise le fallback HTTP quand HTTPS echoue", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("HTTPS failed"))
      .mockResolvedValueOnce(makeResponse(MINIMAL_HTML));

    vi.stubGlobal("fetch", fetchMock);

    const result = await runScan("example.com");

    const httpsCheck = result.checks.find((c) => c.id === "https");
    expect(httpsCheck).toBeDefined();
    expect(httpsCheck!.status).toBe("failed");

    expect(result.checks.length).toBeGreaterThan(1);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://example.com",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://example.com",
      expect.any(Object),
    );
  });

  it("gere l'echec total HTTP et HTTPS avec les resultats DNS", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Connection failed")),
    );

    mockResolveTxt.mockReset();
    mockResolveTxt.mockImplementation(async (domain: string) => {
      if (domain === "example.com")
        return [["v=spf1 include:example.com ~all"]];
      if (domain === "_dmarc.example.com") return [["v=DMARC1; p=reject"]];
      return [];
    });

    const result = await runScan("example.com");

    const httpsCheck = result.checks.find((c) => c.id === "https");
    expect(httpsCheck).toBeDefined();
    expect(httpsCheck!.status).toBe("failed");

    const headerChecks = result.checks.filter((c) =>
      ["hsts", "csp", "x-content-type", "x-frame", "referrer-policy"].includes(
        c.id,
      ),
    );
    for (const check of headerChecks) {
      expect(check.status).toBe("failed");
    }

    const spfCheck = result.checks.find((c) => c.id === "spf");
    expect(spfCheck).toBeDefined();
    expect(spfCheck!.status).toBe("passed");

    const dmarcCheck = result.checks.find((c) => c.id === "dmarc");
    expect(dmarcCheck).toBeDefined();
    expect(dmarcCheck!.status).toBe("passed");
  });

  it("detecte les bons en-tetes de securite", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse(MINIMAL_HTML, GOOD_HEADERS)),
    );

    const result = await runScan("secure.example.com");

    const headerIds = [
      "hsts",
      "csp",
      "x-content-type",
      "x-frame",
      "referrer-policy",
    ];
    for (const id of headerIds) {
      const check = result.checks.find((c) => c.id === id);
      expect(check).toBeDefined();
      expect(check!.status).toBe("passed");
    }
  });

  it("contient id, domain, scannedAt, checks et score", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse(MINIMAL_HTML)),
    );

    const result = await runScan("test.example.com");

    expect(typeof result.id).toBe("string");
    expect(result.id.length).toBeGreaterThan(0);
    expect(result.domain).toBe("test.example.com");
    expect(typeof result.scannedAt).toBe("string");
    expect(new Date(result.scannedAt).getTime()).not.toBeNaN();
    expect(Array.isArray(result.checks)).toBe(true);
    expect(result.score).toHaveProperty("total");
    expect(result.score).toHaveProperty("rgpd");
    expect(result.score).toHaveProperty("cyber");
    expect(result.score).toHaveProperty("grade");
  });
});
