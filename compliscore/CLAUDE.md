@AGENTS.md

# CompliScore

SaaS de scan de conformite RGPD + cybersecurite pour startups/PME.
Score 0-100 avec checklist actionnable.

## Stack

- **Frontend** : Next.js (App Router) + Tailwind CSS v4 + shadcn/ui
- **Backend** : Next.js API Routes + Server Actions
- **DB** : Supabase (Postgres + Auth + RLS)
- **Scan engine** : Node.js (fetch + cheerio + node:dns)
- **Paiement** : LemonSqueezy (V2)
- **Hosting** : Vercel
- **Tests** : Vitest (unit) + Playwright (e2e)

## Conventions

- Langue du code : anglais (variables, fonctions, commentaires)
- Langue du produit (UI) : francais
- TypeScript strict
- Structure a la racine (PAS de src/) :
  - `app/` — Pages (App Router)
  - `components/` — Composants UI (shadcn dans components/ui/)
  - `lib/` — Utilitaires, clients (supabase, etc.)
  - `scanner/` — Moteur de scan (checks RGPD + cyber)
  - `types/` — Types TypeScript
  - `supabase/migrations/` — Migrations SQL
- Server Components par defaut, "use client" uniquement si necessaire
- Import alias: `@/*` maps to project root

## Regles

- V1 = scan gratuit uniquement. Pas de feature creep.
- Pas d'auth en V1. Rate limit par IP.
- Le scan utilise fetch + cheerio + dns. PAS de Playwright/Puppeteer pour scanner.
- Disclaimer obligatoire : "Score indicatif, ne constitue pas un audit legal"
