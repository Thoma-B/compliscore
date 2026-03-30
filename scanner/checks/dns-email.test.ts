import { describe, it, expect, vi } from "vitest";

const mockResolveTxt = vi.fn();

vi.mock("node:dns/promises", () => {
  return {
    default: { resolveTxt: (...args: unknown[]) => mockResolveTxt(...args) },
    resolveTxt: (...args: unknown[]) => mockResolveTxt(...args),
  };
});

import { checkDnsEmail } from "./dns-email";

function findById(results: Awaited<ReturnType<typeof checkDnsEmail>>, id: string) {
  return results.find((r) => r.id === id)!;
}

describe("checkDnsEmail", () => {
  beforeEach(() => {
    mockResolveTxt.mockReset();
  });

  it("returns all passed when all records are present", async () => {
    mockResolveTxt.mockImplementation((domain: string) => {
      if (domain === "example.com") return Promise.resolve([["v=spf1 include:_spf.google.com ~all"]]);
      if (domain === "_dmarc.example.com") return Promise.resolve([["v=DMARC1; p=reject"]]);
      if (domain === "default._domainkey.example.com") return Promise.resolve([["v=DKIM1; k=rsa; p=MIGf..."]]);
      return Promise.reject(Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" }));
    });

    const results = await checkDnsEmail("example.com");

    expect(findById(results, "spf").status).toBe("passed");
    expect(findById(results, "dmarc").status).toBe("passed");
    expect(findById(results, "dkim").status).toBe("passed");
  });

  it("returns failed/failed/warning when no records exist", async () => {
    mockResolveTxt.mockRejectedValue(
      Object.assign(new Error("ENODATA"), { code: "ENODATA" }),
    );

    const results = await checkDnsEmail("no-records.com");

    expect(findById(results, "spf").status).toBe("failed");
    expect(findById(results, "dmarc").status).toBe("failed");
    expect(findById(results, "dkim").status).toBe("warning");
  });

  it("returns spf passed, others missing when only SPF present", async () => {
    mockResolveTxt.mockImplementation((domain: string) => {
      if (domain === "example.com") return Promise.resolve([["v=spf1 ~all"]]);
      return Promise.reject(Object.assign(new Error("ENODATA"), { code: "ENODATA" }));
    });

    const results = await checkDnsEmail("example.com");

    expect(findById(results, "spf").status).toBe("passed");
    expect(findById(results, "dmarc").status).toBe("failed");
    expect(findById(results, "dkim").status).toBe("warning");
  });

  it("treats DNS errors (ENOTFOUND) as missing records", async () => {
    mockResolveTxt.mockRejectedValue(
      Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" }),
    );

    const results = await checkDnsEmail("nonexistent.example");

    expect(findById(results, "spf").status).toBe("failed");
    expect(findById(results, "dmarc").status).toBe("failed");
    expect(findById(results, "dkim").status).toBe("warning");
  });

  it("detects SPF record among other TXT records", async () => {
    mockResolveTxt.mockImplementation((domain: string) => {
      if (domain === "example.com") {
        return Promise.resolve([
          ["google-site-verification=abc123"],
          ["v=spf1 include:_spf.google.com ~all"],
          ["facebook-domain-verification=xyz789"],
        ]);
      }
      return Promise.reject(Object.assign(new Error("ENODATA"), { code: "ENODATA" }));
    });

    const results = await checkDnsEmail("example.com");

    expect(findById(results, "spf").status).toBe("passed");
  });
});
