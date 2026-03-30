# CompliScore

SaaS de scan de conformite RGPD + cybersecurite pour startups/PME.
Score 0-100 avec checklist actionnable.

## Stack

- **Frontend** : Next.js 14+ (App Router) + Tailwind CSS + shadcn/ui
- **Backend** : Next.js API Routes + Server Actions
- **DB** : Supabase (Postgres + Auth + RLS)
- **Scan engine** : Node.js (Playwright pour cookie checks, fetch pour headers, dns pour email)
- **Paiement** : LemonSqueezy
- **Hosting** : Vercel
- **Analytics** : PostHog
- **Errors** : Sentry

## Conventions

- Langue du code : anglais (variables, fonctions, commentaires)
- Langue du produit (UI) : francais
- TypeScript strict partout
- Composants dans `src/components/`, pages dans `src/app/`
- Server Components par defaut, "use client" uniquement si necessaire
- Supabase RLS pour la securite des donnees
- Pas de ORMs complexes, Supabase client directement
- Tests : Vitest pour unit, Playwright pour e2e

## Structure du projet

```
src/
  app/            # Pages (App Router)
  components/     # Composants UI reutilisables
  lib/            # Utilitaires, clients (supabase, etc.)
  scanner/        # Moteur de scan (checks RGPD + cyber)
  types/          # Types TypeScript
supabase/
  migrations/     # Migrations SQL
docs/
  superpowers/specs/  # Specs de design
```

## Roadmap

- **V1** : Landing page + scan engine + score + resultats (semaines 1-6)
- **V2** : Auth + paiement + PDF + dashboard (semaines 7-10)
- **V3** : Monitoring hebdo + alertes (semaines 11-14)
- **V4** : NIS2 + multi-domaines + API (semaines 15+)

## Regles importantes

- V1 = scan gratuit uniquement. Pas de feature creep.
- Le scan doit etre rapide (<60 secondes)
- Disclaimer obligatoire : "Score indicatif, ne constitue pas un audit legal"
- Securite first : ne pas stocker de donnees sensibles des sites scannes
- SEO : chaque page doit etre optimisee (meta, OG, structured data)
