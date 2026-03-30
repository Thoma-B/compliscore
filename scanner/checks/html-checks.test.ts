import { describe, it, expect } from "vitest";
import { checkCookieBanner } from "./cookie-banner";
import { checkPrivacyPolicy } from "./privacy-policy";
import { checkLegalNotices } from "./legal-notices";
import { checkTrackers } from "./trackers";

// ---------------------------------------------------------------------------
// Cookie Banner
// ---------------------------------------------------------------------------
describe("checkCookieBanner", () => {
  it("passes when tarteaucitron script is present", () => {
    const html = `<html><head><script src="https://cdn.tarteaucitron.io/tarteaucitron.js"></script></head><body></body></html>`;
    const result = checkCookieBanner(html);
    expect(result.status).toBe("passed");
    expect(result.id).toBe("cookie-banner");
    expect(result.category).toBe("rgpd");
    expect(result.severity).toBe("critical");
  });

  it("passes when a cookie-consent class element exists", () => {
    const html = `<html><body><div class="cookie-consent">Accepter les cookies</div></body></html>`;
    const result = checkCookieBanner(html);
    expect(result.status).toBe("passed");
  });

  it("fails when no consent elements are found", () => {
    const html = `<html><head><title>Mon site</title></head><body><p>Bonjour</p></body></html>`;
    const result = checkCookieBanner(html);
    expect(result.status).toBe("failed");
  });

  it("passes when Axeptio script is present", () => {
    const html = `<html><head><script src="https://static.axeptio.xyz/sdk.js"></script></head><body></body></html>`;
    const result = checkCookieBanner(html);
    expect(result.status).toBe("passed");
  });

  it("passes with data-cookieconsent attribute", () => {
    const html = `<html><body><div data-cookieconsent="necessary">Content</div></body></html>`;
    const result = checkCookieBanner(html);
    expect(result.status).toBe("passed");
  });
});

// ---------------------------------------------------------------------------
// Privacy Policy
// ---------------------------------------------------------------------------
describe("checkPrivacyPolicy", () => {
  it("passes when a /politique-de-confidentialite link exists", () => {
    const html = `<html><body><a href="/politique-de-confidentialite">Confidentialite</a></body></html>`;
    const result = checkPrivacyPolicy(html);
    expect(result.status).toBe("passed");
    expect(result.id).toBe("privacy-policy");
    expect(result.category).toBe("rgpd");
    expect(result.severity).toBe("critical");
  });

  it("passes when link text contains 'Politique de confidentialité'", () => {
    const html = `<html><body><a href="/page">Politique de confidentialité</a></body></html>`;
    const result = checkPrivacyPolicy(html);
    expect(result.status).toBe("passed");
  });

  it("fails when no privacy links are found", () => {
    const html = `<html><body><a href="/about">A propos</a></body></html>`;
    const result = checkPrivacyPolicy(html);
    expect(result.status).toBe("failed");
  });

  it("passes when a /privacy-policy link exists", () => {
    const html = `<html><body><a href="/privacy-policy">Privacy</a></body></html>`;
    const result = checkPrivacyPolicy(html);
    expect(result.status).toBe("passed");
  });

  it("passes when link text contains 'vie privée'", () => {
    const html = `<html><body><a href="/info">Vie privée</a></body></html>`;
    const result = checkPrivacyPolicy(html);
    expect(result.status).toBe("passed");
  });
});

// ---------------------------------------------------------------------------
// Legal Notices
// ---------------------------------------------------------------------------
describe("checkLegalNotices", () => {
  it("passes when a /mentions-legales link exists", () => {
    const html = `<html><body><a href="/mentions-legales">Mentions</a></body></html>`;
    const result = checkLegalNotices(html);
    expect(result.status).toBe("passed");
    expect(result.id).toBe("legal-notices");
    expect(result.category).toBe("rgpd");
    expect(result.severity).toBe("important");
  });

  it("passes when link text contains 'Mentions légales'", () => {
    const html = `<html><body><a href="/page">Mentions légales</a></body></html>`;
    const result = checkLegalNotices(html);
    expect(result.status).toBe("passed");
  });

  it("fails when no legal links are found", () => {
    const html = `<html><body><a href="/about">A propos</a></body></html>`;
    const result = checkLegalNotices(html);
    expect(result.status).toBe("failed");
  });

  it("passes when a /legal-notice link exists", () => {
    const html = `<html><body><a href="/legal-notice">Legal</a></body></html>`;
    const result = checkLegalNotices(html);
    expect(result.status).toBe("passed");
  });
});

// ---------------------------------------------------------------------------
// Trackers
// ---------------------------------------------------------------------------
describe("checkTrackers", () => {
  it("returns warning when Google Analytics is detected", () => {
    const html = `<html><head><script src="https://www.googletagmanager.com/gtag/js?id=G-ABC123"></script><script>gtag('config', 'G-ABC123');</script></head><body></body></html>`;
    const result = checkTrackers(html);
    expect(result.status).toBe("warning");
    expect(result.id).toBe("trackers");
    expect(result.category).toBe("rgpd");
    expect(result.severity).toBe("important");
    expect(result.details).toContain("Google Analytics");
  });

  it("returns warning and lists both GA and Facebook Pixel", () => {
    const html = `<html><head>
      <script src="https://www.googletagmanager.com/gtag/js?id=G-XYZ"></script>
      <script>fbq('init', '123456');</script>
    </head><body></body></html>`;
    const result = checkTrackers(html);
    expect(result.status).toBe("warning");
    expect(result.details).toContain("Google Analytics");
    expect(result.details).toContain("Facebook Pixel");
  });

  it("passes when no tracker scripts are present", () => {
    const html = `<html><head><script src="/js/app.js"></script></head><body><p>Bonjour</p></body></html>`;
    const result = checkTrackers(html);
    expect(result.status).toBe("passed");
  });

  it("returns warning when GTM is detected", () => {
    const html = `<html><head><script src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXX"></script></head><body></body></html>`;
    const result = checkTrackers(html);
    expect(result.status).toBe("warning");
    expect(result.details).toContain("Google Tag Manager");
  });

  it("detects Hotjar tracker", () => {
    const html = `<html><head><script src="https://static.hotjar.com/c/hotjar-12345.js"></script></head><body></body></html>`;
    const result = checkTrackers(html);
    expect(result.status).toBe("warning");
    expect(result.details).toContain("Hotjar");
  });
});
