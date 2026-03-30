# CompliScore V1 - Implementation Plan

**Date**: 2026-03-30
**Spec**: `docs/superpowers/specs/2026-03-30-compliscore-design.md`
**Scope**: Landing page + scan engine + scoring + results page
**Auth**: Skipped for V1 (rate-limit by IP). Auth + payment = V2.

---

## File Structure

```
compliscore/                        # Next.js project root (inside Making-money/)
  src/
    app/
      layout.tsx                    # Root layout, fonts, metadata
      page.tsx                      # Landing page with scan form
      scan/[id]/page.tsx            # Results page (SSR)
      api/scan/route.ts             # POST - initiate a scan
      api/scan/[id]/route.ts        # GET - retrieve scan results
    components/
      header.tsx                    # Site header with logo
      footer.tsx                    # Footer with disclaimer
      scan-form.tsx                 # Domain input + submit button (client component)
      scan-loading.tsx              # Loading state with progress (client component)
      score-gauge.tsx               # Circular score gauge (client component)
      grade-badge.tsx               # A/B/C/D/F letter badge
      category-score.tsx            # RGPD or Cyber sub-score display
      check-list.tsx                # List of check results
      check-item.tsx                # Single check: icon + label + status + explanation
      share-button.tsx              # "Partager mon score" button (client component)
    scanner/
      index.ts                      # Orchestrator: runs all checks, returns ScanResult
      scoring.ts                    # Score calculation with weighted checks
      checks/
        https.ts                    # HTTPS + certificate validity
        headers.ts                  # Security headers (HSTS, CSP, X-Frame, etc.)
        cookies.ts                  # Cookie flags (Secure, HttpOnly, SameSite)
        server-info.ts              # Server header exposure check
        mixed-content.ts            # HTTP resources in HTTPS page
        dns-email.ts                # SPF, DKIM, DMARC via DNS
        cookie-banner.ts            # Cookie consent banner detection in HTML
        privacy-policy.ts           # Privacy policy link/page detection
        legal-notices.ts            # Mentions légales detection
        trackers.ts                 # Third-party tracker scripts detection
      types.ts                      # Scanner-specific types (CheckResult, ScanResult, etc.)
    lib/
      supabase/
        client.ts                   # Browser Supabase client
        server.ts                   # Server Supabase client
      domain-validator.ts           # Domain input validation + normalization
    types/
      index.ts                      # App-wide shared types
  supabase/
    migrations/
      001_create_scans.sql          # scans table: id, domain, results, score, created_at, ip_hash
  vitest.config.ts
  playwright.config.ts              # For e2e tests only (NOT for scanning)
```

**Key decision**: V1 scan engine uses `fetch` + `cheerio` (HTML parsing) + `node:dns` only. No Playwright/Puppeteer for scanning — keeps it fast and cheap. Playwright is only for our own e2e tests.

---

## Task 1: Project scaffolding

**Goal:** Initialize Next.js project with all dependencies and config.

**Files to create:**
- `compliscore/` — entire Next.js scaffold
- `compliscore/src/app/layout.tsx` — root layout
- `compliscore/vitest.config.ts` — test config

**Steps:**
1. Run `npx create-next-app@latest compliscore --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` inside `Making-money/`
2. Install deps: `pnpm add cheerio @supabase/supabase-js`
3. Install dev deps: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom`
4. Init shadcn/ui: `pnpm dlx shadcn@latest init`
5. Add shadcn components: `pnpm dlx shadcn@latest add button input card badge progress`
6. Create folder structure: `src/scanner/checks/`, `src/lib/supabase/`, `src/types/`
7. Configure `vitest.config.ts` with jsdom environment
8. Verify: `pnpm build && pnpm test` (both should pass with zero errors)

**Commit message:** `feat: scaffold compliscore next.js project with deps`

---

## Task 2: Scanner types + scoring algorithm

**Goal:** Define all scanner types and implement the weighted scoring algorithm. Pure logic, no I/O.

**Files to modify:**
- `src/scanner/types.ts` — define types
- `src/scanner/scoring.ts` — scoring logic
- `src/scanner/scoring.test.ts` — tests

**Types to define in `types.ts`:**
```typescript
export type CheckStatus = "passed" | "warning" | "failed";
export type CheckSeverity = "critical" | "important" | "nice_to_have";
export type CheckCategory = "rgpd" | "cyber";

export interface CheckResult {
  id: string;
  name: string;                    // e.g. "HTTPS actif"
  description: string;             // French explanation
  category: CheckCategory;
  severity: CheckSeverity;
  status: CheckStatus;
  details?: string;                // Why it failed / extra info
}

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface ScanScore {
  total: number;                   // 0-100
  rgpd: number;                    // 0-100
  cyber: number;                   // 0-100
  grade: Grade;
}

export interface ScanResult {
  id: string;
  domain: string;
  checks: CheckResult[];
  score: ScanScore;
  scannedAt: string;               // ISO date
}
```

**Scoring logic in `scoring.ts`:**
```typescript
// Weights: critical=3, important=2, nice_to_have=1
// Score per category = weighted_passed / weighted_total * 100
// Total = (rgpd + cyber) / 2
// Grade: A=90+, B=70-89, C=50-69, D=30-49, F=0-29
```

**Steps:**
1. Write `types.ts` with all interfaces
2. Write tests in `scoring.test.ts`:
   - All checks passed → score 100, grade A
   - All checks failed → score 0, grade F
   - Mix of critical fail + nice_to_have pass → weighted correctly
   - Category scores calculated independently
   - Grade boundaries (89→B, 90→A, etc.)
3. Implement `scoring.ts` to make tests pass
4. Verify: `pnpm vitest run src/scanner/scoring.test.ts`

**Commit message:** `feat: add scanner types and weighted scoring algorithm`

---

## Task 3: HTTP-based security checks

**Goal:** Implement checks that only need an HTTP request: HTTPS, headers, cookies, server info, mixed content.

**Files to modify:**
- `src/scanner/checks/https.ts` — HTTPS + cert check
- `src/scanner/checks/headers.ts` — security headers
- `src/scanner/checks/cookies.ts` — cookie flags
- `src/scanner/checks/server-info.ts` — server header leak
- `src/scanner/checks/mixed-content.ts` — HTTP in HTTPS
- `src/scanner/checks/http-checks.test.ts` — tests for all HTTP checks

**Check details:**

`https.ts` — `checkHttps(domain: string): Promise<CheckResult>`
- Fetch `https://{domain}`, check response.ok
- Severity: critical
- If HTTPS fails, all other HTTP checks skip gracefully

`headers.ts` — `checkSecurityHeaders(headers: Headers): Promise<CheckResult[]>`
- Returns array of CheckResults, one per header:
  - HSTS (Strict-Transport-Security) — important
  - CSP (Content-Security-Policy) — important
  - X-Content-Type-Options — nice_to_have
  - X-Frame-Options — nice_to_have
  - Referrer-Policy — nice_to_have

`cookies.ts` — `checkCookieFlags(headers: Headers): Promise<CheckResult>`
- Parse Set-Cookie headers, check Secure/HttpOnly/SameSite flags
- Severity: important

`server-info.ts` — `checkServerInfo(headers: Headers): Promise<CheckResult>`
- Check if Server header leaks version info (e.g. "Apache/2.4.51")
- Severity: nice_to_have

`mixed-content.ts` — `checkMixedContent(html: string): Promise<CheckResult>`
- Parse HTML with cheerio, find `src="http://..."` in img/script/link tags
- Severity: nice_to_have

**Steps:**
1. Write failing tests with mocked fetch responses (use vitest mocking)
2. Implement each check function
3. Each function takes minimal input (domain, headers, or html) and returns `CheckResult`
4. Verify: `pnpm vitest run src/scanner/checks/http-checks.test.ts`

**Commit message:** `feat: add HTTP-based security checks (https, headers, cookies, server, mixed-content)`

---

## Task 4: DNS email checks

**Goal:** Check SPF, DKIM, DMARC records via DNS lookups.

**Files to modify:**
- `src/scanner/checks/dns-email.ts` — DNS checks
- `src/scanner/checks/dns-email.test.ts` — tests

**Check details:**

`checkDnsEmail(domain: string): Promise<CheckResult[]>` returns 3 CheckResults:
- **SPF**: query TXT records for `domain`, look for `v=spf1` — severity: important
- **DMARC**: query TXT records for `_dmarc.{domain}`, look for `v=DMARC1` — severity: important
- **DKIM**: query TXT records for `default._domainkey.{domain}`, look for `v=DKIM1` — severity: nice_to_have (hard to detect selector)

Uses `node:dns/promises` (resolveTxt).

**Steps:**
1. Write failing tests (mock `dns.resolveTxt`)
2. Implement `checkDnsEmail`
3. Handle DNS errors gracefully (ENOTFOUND = no record = failed)
4. Verify: `pnpm vitest run src/scanner/checks/dns-email.test.ts`

**Commit message:** `feat: add DNS email checks (SPF, DKIM, DMARC)`

---

## Task 5: HTML analysis checks (RGPD)

**Goal:** Detect cookie banner, privacy policy, legal notices, and third-party trackers from HTML content.

**Files to modify:**
- `src/scanner/checks/cookie-banner.ts` — cookie banner detection
- `src/scanner/checks/privacy-policy.ts` — privacy policy detection
- `src/scanner/checks/legal-notices.ts` — mentions légales detection
- `src/scanner/checks/trackers.ts` — tracker detection
- `src/scanner/checks/html-checks.test.ts` — tests

**Check details:**

`checkCookieBanner(html: string): Promise<CheckResult>`
- Detect known consent scripts: tarteaucitron, axeptio, cookiebot, onetrust, didomi, quantcast, cookies-eu-banner
- Also check for common CSS classes/IDs: `cookie-banner`, `cookie-consent`, `gdpr-banner`
- Severity: critical

`checkPrivacyPolicy(html: string, domain: string): Promise<CheckResult>`
- Search links for: `politique-de-confidentialite`, `privacy-policy`, `privacy`, `confidentialite`, `donnees-personnelles`
- Severity: critical

`checkLegalNotices(html: string, domain: string): Promise<CheckResult>`
- Search links for: `mentions-legales`, `legal`, `mentions-obligatoires`
- Severity: important

`checkTrackers(html: string): Promise<CheckResult>`
- Detect known trackers in script tags:
  - Google Analytics (gtag, ga.js, analytics.js, GA4)
  - Meta Pixel (fbq, facebook pixel)
  - Google Tag Manager
  - Hotjar, Segment, Mixpanel, etc.
- Return list of detected trackers in `details`
- Status: "warning" if trackers found (not necessarily bad, just flagged)
- Severity: important

**Steps:**
1. Write failing tests with sample HTML containing/missing each element
2. Implement each check using cheerio for HTML parsing
3. Keep detection patterns in const arrays for easy extension
4. Verify: `pnpm vitest run src/scanner/checks/html-checks.test.ts`

**Commit message:** `feat: add HTML analysis checks (cookie banner, privacy, legal, trackers)`

---

## Task 6: Scan orchestrator

**Goal:** Wire all checks together into a single `runScan(domain)` function that returns a complete `ScanResult`.

**Files to modify:**
- `src/scanner/index.ts` — orchestrator
- `src/scanner/index.test.ts` — integration test
- `src/lib/domain-validator.ts` — domain validation
- `src/lib/domain-validator.test.ts` — tests

**Orchestrator logic:**
```typescript
export async function runScan(domain: string): Promise<ScanResult> {
  // 1. Validate & normalize domain
  // 2. Fetch homepage (HTTPS first, fallback HTTP)
  // 3. Run all checks in parallel where possible:
  //    - HTTP checks (from response headers + html)
  //    - DNS checks (independent, parallel)
  //    - HTML checks (from html body)
  // 4. Collect all CheckResults
  // 5. Calculate score
  // 6. Return ScanResult with unique ID
}
```

**Domain validator:**
```typescript
export function validateDomain(input: string): { valid: boolean; domain: string; error?: string }
// - Strip protocol, path, query
// - Validate format (no spaces, valid TLD)
// - Normalize: lowercase, trim
```

**Steps:**
1. Write tests for domain validator (valid, invalid, with protocol, with path, etc.)
2. Implement domain validator
3. Write integration test for orchestrator (mock fetch + dns)
4. Implement orchestrator — run checks in parallel, aggregate results
5. Verify: `pnpm vitest run src/scanner/` (all scanner tests)

**Commit message:** `feat: add scan orchestrator and domain validator`

---

## Task 7: Supabase schema + client setup

**Goal:** Create the scans table and configure Supabase clients for storing/retrieving scan results.

**Files to modify:**
- `supabase/migrations/001_create_scans.sql` — migration
- `src/lib/supabase/client.ts` — browser client
- `src/lib/supabase/server.ts` — server client
- `.env.local.example` — env template

**Schema:**
```sql
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  results JSONB NOT NULL,         -- full ScanResult JSON
  score INTEGER NOT NULL,         -- 0-100 for quick queries
  grade TEXT NOT NULL,            -- A/B/C/D/F
  ip_hash TEXT NOT NULL,          -- SHA256 of IP for rate limiting
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scans_ip_hash ON scans(ip_hash);
CREATE INDEX idx_scans_domain ON scans(domain);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);

-- Rate limit: max 3 scans per IP per day (checked in API, not RLS)
-- No RLS needed for V1 (no auth), results are public by scan ID
```

**Steps:**
1. Write migration SQL
2. Create `.env.local.example` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Implement `server.ts` — creates server client using `@supabase/ssr` or service role key
4. Implement `client.ts` — creates browser client
5. Verify: migration applies cleanly on a Supabase project (manual step, document how)

**Commit message:** `feat: add supabase schema and client setup`

---

## Task 8: API routes

**Goal:** Create POST /api/scan (run scan) and GET /api/scan/[id] (get results) endpoints.

**Files to modify:**
- `src/app/api/scan/route.ts` — POST handler
- `src/app/api/scan/[id]/route.ts` — GET handler

**POST /api/scan:**
```typescript
// Request: { domain: string }
// 1. Validate domain
// 2. Check rate limit (3 scans/day per IP)
// 3. Run scan
// 4. Store in Supabase
// 5. Return { id, score, grade } (redirect to results page)
// Errors: 400 (invalid domain), 429 (rate limited), 500 (scan error)
```

**GET /api/scan/[id]:**
```typescript
// 1. Fetch scan by ID from Supabase
// 2. Return full ScanResult JSON
// Errors: 404 (not found)
```

**Steps:**
1. Implement POST route with domain validation + rate limit check
2. Implement GET route
3. Add proper error responses with French error messages
4. Test manually with curl: `curl -X POST localhost:3000/api/scan -d '{"domain":"example.com"}'`
5. Verify: `curl localhost:3000/api/scan/{returned-id}` returns results

**Commit message:** `feat: add scan API routes (POST + GET)`

---

## Task 9: Landing page

**Goal:** Build the homepage with hero section, scan form, and SEO metadata.

**Files to modify:**
- `src/app/page.tsx` — landing page
- `src/app/layout.tsx` — update with metadata, fonts
- `src/components/header.tsx` — site header
- `src/components/footer.tsx` — footer with disclaimer
- `src/components/scan-form.tsx` — domain input form (client component)
- `src/components/scan-loading.tsx` — loading state (client component)

**Landing page structure:**
```
[Header: CompliScore logo]
[Hero section]
  Headline: "Votre site est-il conforme au RGPD ?"
  Subline: "Scan gratuit en 30 secondes. Decouvrez votre score."
  [Domain input] [Scanner button]
[How it works: 3 steps icons]
  1. Entrez votre domaine
  2. Notre scanner analyse votre site
  3. Recevez votre score + recommandations
[Footer: disclaimer + credits]
```

**Scan form behavior:**
1. User enters domain, clicks "Scanner"
2. POST to /api/scan
3. Show loading state (scan-loading.tsx) with animated progress
4. On success: redirect to /scan/[id]
5. On error: show error message inline

**Steps:**
1. Build `header.tsx` and `footer.tsx` (server components)
2. Build `scan-form.tsx` (client component: input + button + fetch + redirect)
3. Build `scan-loading.tsx` (client component: spinner + "Analyse en cours...")
4. Compose in `page.tsx` with hero section
5. Update `layout.tsx` with metadata: title, description, OG tags
6. Verify: `pnpm dev` → page loads, form submits, redirects to results

**Commit message:** `feat: add landing page with scan form`

---

## Task 10: Results page

**Goal:** Build the scan results page with score gauge, grade, checklist, and share button.

**Files to modify:**
- `src/app/scan/[id]/page.tsx` — results page (SSR)
- `src/components/score-gauge.tsx` — circular score visualization (client component)
- `src/components/grade-badge.tsx` — letter grade A-F
- `src/components/category-score.tsx` — sub-score for RGPD / Cyber
- `src/components/check-list.tsx` — grouped check results
- `src/components/check-item.tsx` — single check with status icon
- `src/components/share-button.tsx` — copy link / share (client component)

**Results page structure:**
```
[Header]
[Domain scanned: example.com — date]
[Score gauge: 72/100] [Grade badge: B]
[Two columns: RGPD score | Cyber score]
[Check list - RGPD section]
  ✅ Politique de confidentialite detectee
  ❌ Cookie banner non conforme — "Le refus doit etre aussi facile que l'acceptation"
  ...
[Check list - Cyber section]
  ✅ HTTPS actif
  ⚠️ Header HSTS manquant — "Protege contre les attaques downgrade"
  ...
[CTA: "Ameliorez votre score — bientot disponible"]
[Share button: "Partager mon score"]
[Footer with disclaimer]
```

**Score gauge:** Circular SVG gauge, color-coded (green A, yellow B, orange C, red D/F). Animated on load.

**Check item statuses:**
- passed: green checkmark
- warning: yellow triangle
- failed: red X

**SSR:** Page fetches scan from Supabase server-side. OG meta tags include score for social sharing.

**Steps:**
1. Build `grade-badge.tsx` — simple colored badge
2. Build `score-gauge.tsx` — animated circular gauge (SVG + CSS animation)
3. Build `category-score.tsx` — small gauge or progress bar for RGPD/Cyber
4. Build `check-item.tsx` — icon + label + status + expandable details
5. Build `check-list.tsx` — groups check-items by category
6. Build `share-button.tsx` — copies URL to clipboard
7. Compose in `scan/[id]/page.tsx` — SSR fetch + layout
8. Add dynamic OG tags (score in title: "example.com — Score B (72/100)")
9. Verify: `pnpm dev` → navigate to /scan/[id] → full results display correctly

**Commit message:** `feat: add results page with score gauge and checklist`

---

## Task 11: Polish + rate limiting + error handling

**Goal:** Add rate limiting, error pages, loading states, and final polish.

**Files to modify:**
- `src/app/api/scan/route.ts` — add rate limiting logic
- `src/app/scan/[id]/not-found.tsx` — 404 page for invalid scan IDs
- `src/app/error.tsx` — global error boundary
- `src/app/loading.tsx` — global loading state

**Rate limiting:**
- Hash IP with SHA-256 (don't store raw IPs)
- Query Supabase: count scans by ip_hash in last 24h
- Limit: 3 scans/day for free users
- Return 429 with French message: "Limite atteinte. Revenez demain ou passez au plan Pro."

**Steps:**
1. Implement rate limit check in POST /api/scan
2. Add not-found.tsx for invalid scan IDs
3. Add error.tsx global error boundary
4. Test rate limiting: run 4 scans, verify 4th is blocked
5. Verify: all error states display correctly in French

**Commit message:** `feat: add rate limiting, error handling, and polish`

---

## Task 12: SEO + final deployment prep

**Goal:** Optimize for search engines and prepare for Vercel deployment.

**Files to modify:**
- `src/app/layout.tsx` — structured data, final metadata
- `src/app/sitemap.ts` — dynamic sitemap
- `src/app/robots.ts` — robots.txt
- `src/app/opengraph-image.tsx` — OG image generation (optional, nice to have)

**SEO checklist:**
- Title: "CompliScore — Audit RGPD & Cybersecurite Gratuit"
- Description: "Scannez votre site et decouvrez votre score de conformite RGPD et cybersecurite en 30 secondes. Gratuit."
- OG tags on all pages
- Dynamic OG for results pages (show score)
- Sitemap at /sitemap.xml
- robots.txt allowing all
- JSON-LD structured data (WebApplication)

**Steps:**
1. Add sitemap.ts and robots.ts
2. Add JSON-LD structured data to layout
3. Verify OG tags with `curl -s localhost:3000 | grep "og:"`
4. Run `pnpm build` — zero errors
5. Verify: Lighthouse SEO score > 90

**Commit message:** `feat: add SEO optimization and deployment prep`

---

## Quality Checklist

- [x] Every task has a verification command
- [x] No task requires reading other tasks to understand
- [x] File structure section covers all files touched
- [x] Tests specified for every behavior change
- [x] Commit points defined (small, frequent)
- [x] No "magic knowledge" assumed
- [x] YAGNI applied — no auth, no payment, no PDF in V1

---

## Dependency Graph

```
Task 1 (scaffold)
  ├── Task 2 (types + scoring)
  │     └── Task 6 (orchestrator) ──→ Task 8 (API) ──→ Task 11 (polish)
  ├── Task 3 (HTTP checks) ────────┘
  ├── Task 4 (DNS checks) ─────────┘
  ├── Task 5 (HTML checks) ────────┘
  ├── Task 7 (Supabase) ──────────────→ Task 8 (API)
  ├── Task 9 (landing page) ──────────→ Task 11 (polish)
  └── Task 10 (results page) ─────────→ Task 11 (polish) → Task 12 (SEO)
```

**Parallelizable:** Tasks 2-5 can run in parallel after Task 1. Tasks 9-10 can run in parallel with Tasks 3-6.
