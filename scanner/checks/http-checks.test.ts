import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkHttps } from "@/scanner/checks/https";
import { checkSecurityHeaders } from "@/scanner/checks/headers";
import { checkCookieFlags } from "@/scanner/checks/cookies";
import { checkServerInfo } from "@/scanner/checks/server-info";
import { checkMixedContent } from "@/scanner/checks/mixed-content";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHeaders(
  map: Record<string, string>,
  setCookies: string[] = [],
): Headers {
  const h = new Headers(map);
  // Override getSetCookie to return our test cookies
  h.getSetCookie = () => setCookies;
  return h;
}

// ---------------------------------------------------------------------------
// checkHttps
// ---------------------------------------------------------------------------

describe("checkHttps", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns passed when fetch succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("ok", { status: 200 })),
    );

    const result = await checkHttps("example.com");
    expect(result.id).toBe("https");
    expect(result.status).toBe("passed");
    expect(result.category).toBe("cyber");
    expect(result.severity).toBe("critical");
    expect(fetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({ redirect: "follow" }),
    );
  });

  it("returns failed when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connection refused")),
    );

    const result = await checkHttps("bad-domain.test");
    expect(result.id).toBe("https");
    expect(result.status).toBe("failed");
    expect(result.details).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// checkSecurityHeaders
// ---------------------------------------------------------------------------

describe("checkSecurityHeaders", () => {
  it("returns passed for all headers when present", async () => {
    const headers = makeHeaders({
      "strict-transport-security": "max-age=31536000",
      "content-security-policy": "default-src 'self'",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "referrer-policy": "no-referrer",
    });

    const results = await checkSecurityHeaders(headers);
    expect(results).toHaveLength(5);
    for (const r of results) {
      expect(r.status).toBe("passed");
      expect(r.category).toBe("cyber");
    }
  });

  it("returns failed for missing headers", async () => {
    const headers = makeHeaders({});

    const results = await checkSecurityHeaders(headers);
    expect(results).toHaveLength(5);
    for (const r of results) {
      expect(r.status).toBe("failed");
    }
  });

  it("returns mixed results when some headers are present", async () => {
    const headers = makeHeaders({
      "strict-transport-security": "max-age=31536000",
      "x-frame-options": "SAMEORIGIN",
    });

    const results = await checkSecurityHeaders(headers);
    const passed = results.filter((r) => r.status === "passed");
    const failed = results.filter((r) => r.status === "failed");
    expect(passed).toHaveLength(2);
    expect(failed).toHaveLength(3);
  });

  it("assigns correct ids", async () => {
    const headers = makeHeaders({});
    const results = await checkSecurityHeaders(headers);
    const ids = results.map((r) => r.id);
    expect(ids).toEqual([
      "hsts",
      "csp",
      "x-content-type",
      "x-frame",
      "referrer-policy",
    ]);
  });

  it("assigns correct severity per header", async () => {
    const headers = makeHeaders({});
    const results = await checkSecurityHeaders(headers);
    const severityMap = Object.fromEntries(
      results.map((r) => [r.id, r.severity]),
    );
    expect(severityMap["hsts"]).toBe("important");
    expect(severityMap["csp"]).toBe("important");
    expect(severityMap["x-content-type"]).toBe("nice_to_have");
    expect(severityMap["x-frame"]).toBe("nice_to_have");
    expect(severityMap["referrer-policy"]).toBe("nice_to_have");
  });
});

// ---------------------------------------------------------------------------
// checkCookieFlags
// ---------------------------------------------------------------------------

describe("checkCookieFlags", () => {
  it("returns passed when no cookies are set", async () => {
    const headers = makeHeaders({});
    const result = await checkCookieFlags(headers);
    expect(result.id).toBe("cookie-flags");
    expect(result.status).toBe("passed");
    expect(result.category).toBe("cyber");
    expect(result.severity).toBe("important");
  });

  it("returns passed when all cookies have all flags", async () => {
    const headers = makeHeaders({}, [
      "session=abc; Secure; HttpOnly; SameSite=Strict",
      "token=xyz; Secure; HttpOnly; SameSite=Lax",
    ]);
    const result = await checkCookieFlags(headers);
    expect(result.status).toBe("passed");
  });

  it("returns warning when some cookies are missing flags", async () => {
    const headers = makeHeaders({}, [
      "session=abc; Secure; HttpOnly; SameSite=Strict",
      "token=xyz",
    ]);
    const result = await checkCookieFlags(headers);
    expect(result.status).toBe("warning");
  });

  it("returns failed when no cookies have the required flags", async () => {
    const headers = makeHeaders({}, [
      "session=abc",
      "token=xyz; Path=/",
    ]);
    const result = await checkCookieFlags(headers);
    expect(result.status).toBe("failed");
  });
});

// ---------------------------------------------------------------------------
// checkServerInfo
// ---------------------------------------------------------------------------

describe("checkServerInfo", () => {
  it("returns passed when Server header is absent", async () => {
    const headers = makeHeaders({});
    const result = await checkServerInfo(headers);
    expect(result.id).toBe("server-info");
    expect(result.status).toBe("passed");
    expect(result.category).toBe("cyber");
    expect(result.severity).toBe("nice_to_have");
  });

  it("returns passed when Server header is generic (no version)", async () => {
    const headers = makeHeaders({ server: "nginx" });
    const result = await checkServerInfo(headers);
    expect(result.status).toBe("passed");
  });

  it("returns failed when Server header exposes a version", async () => {
    const headers = makeHeaders({ server: "Apache/2.4.51" });
    const result = await checkServerInfo(headers);
    expect(result.status).toBe("failed");
    expect(result.details).toContain("Apache/2.4.51");
  });

  it("returns failed for nginx with version", async () => {
    const headers = makeHeaders({ server: "nginx/1.21.3" });
    const result = await checkServerInfo(headers);
    expect(result.status).toBe("failed");
  });
});

// ---------------------------------------------------------------------------
// checkMixedContent
// ---------------------------------------------------------------------------

describe("checkMixedContent", () => {
  it("returns passed for clean HTML with no http:// resources", async () => {
    const html = `
      <html>
        <head><link href="https://cdn.example.com/style.css" rel="stylesheet"></head>
        <body>
          <img src="https://cdn.example.com/logo.png" />
          <script src="https://cdn.example.com/app.js"></script>
        </body>
      </html>`;

    const result = await checkMixedContent(html);
    expect(result.id).toBe("mixed-content");
    expect(result.status).toBe("passed");
    expect(result.category).toBe("cyber");
    expect(result.severity).toBe("nice_to_have");
  });

  it("returns failed when img src uses http://", async () => {
    const html = `<html><body><img src="http://insecure.com/img.png" /></body></html>`;
    const result = await checkMixedContent(html);
    expect(result.status).toBe("failed");
    expect(result.details).toContain("http://insecure.com/img.png");
  });

  it("returns failed when script src uses http://", async () => {
    const html = `<html><body><script src="http://evil.com/tracker.js"></script></body></html>`;
    const result = await checkMixedContent(html);
    expect(result.status).toBe("failed");
  });

  it("returns failed when link href uses http://", async () => {
    const html = `<html><head><link href="http://cdn.test/style.css" rel="stylesheet"></head><body></body></html>`;
    const result = await checkMixedContent(html);
    expect(result.status).toBe("failed");
  });

  it("returns failed when iframe src uses http://", async () => {
    const html = `<html><body><iframe src="http://embed.test/widget"></iframe></body></html>`;
    const result = await checkMixedContent(html);
    expect(result.status).toBe("failed");
  });

  it("returns passed for relative and protocol-relative URLs", async () => {
    const html = `
      <html><body>
        <img src="/images/logo.png" />
        <script src="//cdn.example.com/app.js"></script>
        <link href="/styles/main.css" rel="stylesheet">
      </body></html>`;

    const result = await checkMixedContent(html);
    expect(result.status).toBe("passed");
  });

  it("counts multiple insecure resources", async () => {
    const html = `
      <html><body>
        <img src="http://a.com/1.png" />
        <img src="http://b.com/2.png" />
        <script src="http://c.com/3.js"></script>
      </body></html>`;

    const result = await checkMixedContent(html);
    expect(result.status).toBe("failed");
    expect(result.details).toContain("3 ressource(s)");
  });
});
