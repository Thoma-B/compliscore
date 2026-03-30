# CompliScore - Design Spec

**Date**: 2026-03-30
**Status**: Approved
**Author**: Hayato + Claude

---

## 1. Vision

SaaS qui scanne la presence en ligne d'une startup/PME et genere un score de conformite RGPD + cybersecurite (0-100) avec une checklist actionnable.

**Cible principale** : Startups tech (puis TPE/PME en expansion)
**Proposition de valeur** : "Decouvre ton score de conformite en 30 secondes. Gratuit."

---

## 2. MVP - V1 (Scan gratuit + Score)

### Flow utilisateur

1. Landing page avec champ "Entre ton domaine"
2. Scan automatique (30-60 secondes)
3. Page resultats : score 0-100 + rapport detaille
4. CTA vers plan Pro

### Checks du scan

#### RGPD (50% du score)
- [ ] Cookie banner detecte
- [ ] Cookie banner conforme (refus aussi facile qu'acceptation)
- [ ] Politique de confidentialite presente
- [ ] Politique de confidentialite : mentions obligatoires (responsable, finalites, droits, DPO)
- [ ] Mentions legales presentes
- [ ] Formulaires : case consentement, mention finalite
- [ ] Sous-traitants detectes (Google Analytics, Meta Pixel, etc.) et documentes

#### Cybersecurite (50% du score)
- [ ] HTTPS actif + certificat valide
- [ ] Headers securite : HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- [ ] SPF, DKIM, DMARC sur le domaine email
- [ ] Pas de ports dangereux exposes (scan leger)
- [ ] Version serveur non exposee (Server header)
- [ ] Cookies : flags Secure, HttpOnly, SameSite
- [ ] Mixed content (HTTP dans HTTPS)

### Systeme de scoring

```
Score = (checks_passed / total_checks) * 100

Ponderation par criticite :
- Critique (x3) : HTTPS, cookie banner, politique confidentialite
- Important (x2) : Headers securite, SPF/DKIM/DMARC, consentement formulaires
- Bon a avoir (x1) : Server header, mixed content, etc.

Grades :
- 90-100 : A (Excellent)
- 70-89  : B (Bon, quelques points a corriger)
- 50-69  : C (Risques identifies)
- 30-49  : D (Non conforme)
- 0-29   : F (Critique)
```

### Page de resultats

- Score global (jauge visuelle)
- Score RGPD + Score Cyber separes
- Liste des checks : passed / warning / failed
- Pour chaque check failed : explication courte + pourquoi c'est important
- CTA : "Ameliore ton score" → plan Pro
- Bouton partage : "Mon site est note A sur CompliScore"

---

## 3. Monetisation

| Tier | Prix | Contenu |
|---|---|---|
| Free | 0 EUR | 1 scan/mois, score + resume, 3 recommandations visibles |
| Pro | 29 EUR/mois | Scans illimites, rapport PDF complet, monitoring hebdo, alertes email |
| Business | 79 EUR/mois | Multi-domaines (jusqu'a 10), guide remediation, rapports white-label (V2) |

**Objectif 6 mois** : 100 utilisateurs Pro = 2 900 EUR MRR

---

## 4. Stack technique

| Composant | Technologie | Justification |
|---|---|---|
| Frontend | Next.js 14+ App Router | SSR pour SEO, React ecosystem |
| UI | Tailwind CSS + shadcn/ui | Rapide, pro, accessible |
| Backend | Next.js API Routes + Server Actions | Monorepo simple |
| Base de donnees | Supabase (Postgres + Auth + Row Level Security) | Gratuit au debut, scalable |
| Scan engine | Node.js (puppeteer/playwright pour cookie check, node-fetch pour headers, dns.resolve pour email) | Meme runtime que le reste |
| File d'attente | Inngest ou BullMQ (si besoin) | Scans asynchrones |
| Paiement | LemonSqueezy | Gestion TVA auto, simple |
| Hosting | Vercel | Zero config, free tier genereux |
| Monitoring | PostHog (analytics) + Sentry (errors) | Gratuits au debut |

**Cout mensuel estime** : 0 EUR au lancement (free tiers), ~20-50 EUR a 1000+ users

---

## 5. Distribution (sans audience)

### SEO (priorite 1)
- Pages cibles : "audit RGPD gratuit", "verifier conformite site web", "score cybersecurite site", "RGPD checker"
- Blog : articles sur chaque check ("Pourquoi votre site a besoin de HSTS", "Cookie banner RGPD : les erreurs courantes")
- Chaque scan genere une URL publique partageable (backlinks naturels)

### Lancement
- ProductHunt (launch day)
- Hacker News (Show HN)
- r/startups, r/SaaS, r/france, r/cybersecurity

### Communautes
- Groupes Slack/Discord startups FR (French Tech, Station F, etc.)
- LinkedIn posts avec exemples de scans de sites connus
- Twitter/X #buildinpublic

### Partenariats (V2)
- Comptables / experts-comptables
- Avocats RGPD
- Incubateurs / accelerateurs

---

## 6. Roadmap

### V1 - MVP (semaines 1-6)
- Landing page + scan engine
- Score + page resultats
- Auth (signup/login)
- 1 scan gratuit/mois

### V2 - Monetisation (semaines 7-10)
- Plans Pro/Business + paiement LemonSqueezy
- Rapport PDF telecharger
- Dashboard historique des scans

### V3 - Retention (semaines 11-14)
- Monitoring hebdomadaire automatique
- Alertes email si score baisse
- Guide de remediation pas-a-pas

### V4 - Expansion (semaines 15+)
- NIS2 checks
- Multi-domaines
- Rapports white-label
- API publique

---

## 7. Risques et mitigations

| Risque | Mitigation |
|---|---|
| Scan trop lent | Queue asynchrone + resultats caches |
| Faux positifs/negatifs | Disclaimer "indicatif, pas un audit legal" + amelioration continue |
| Sites qui bloquent les scans | User-agent classique, fallback sur checks DNS/headers only |
| Concurrence (Cookiebot, etc.) | Positionnement different : score global, pas juste cookies |
| Cout API si viral | Pas de LLM en V1, juste du scan technique = cout quasi nul |
