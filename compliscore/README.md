# CompliScore

> Scan de conformité RGPD + cybersécurité pour startups et PME — score 0-100 avec checklist actionnable.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-postgres-green?logo=supabase)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## ✨ Fonctionnalités

- **Scan en < 60 secondes** — entrez un domaine, obtenez un score instantané
- **Score 0-100** avec grade (A → F) et détail par catégorie
- **Checklist actionnable** — chaque point expliqué avec recommandations concrètes
- **Checks couverts :**
  - 🔒 HTTPS & headers de sécurité (CSP, HSTS, X-Frame-Options...)
  - 🍪 Bannière cookies & conformité RGPD
  - 📄 Politique de confidentialité & mentions légales
  - 📧 Sécurité email (SPF, DKIM, DMARC)
  - 🕵️ Trackers tiers détectés
  - 🔓 Informations serveur exposées

---

## 🛠 Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes |
| Base de données | Supabase (PostgreSQL + RLS) |
| Moteur de scan | Node.js (fetch, dns, cheerio) |
| Tests | Vitest |
| Déploiement | Vercel |

---

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- pnpm
- Compte [Supabase](https://supabase.com)

### Installation

```bash
git clone https://github.com/Thoma-B/compliscore.git
cd compliscore
pnpm install
```

### Configuration

```bash
cp .env.local.example .env.local
```

Remplissez `.env.local` avec vos credentials Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Base de données

```bash
# Appliquer les migrations
supabase db push
# ou manuellement via Supabase Studio
```

### Développement

```bash
pnpm dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

---

## 🧪 Tests

```bash
pnpm test        # run all tests
pnpm test:watch  # watch mode
```

---

## 📁 Structure

```
compliscore/
├── app/                    # Pages Next.js (App Router)
│   ├── api/scan/           # API routes du moteur de scan
│   └── scan/[id]/          # Page de résultats
├── components/             # Composants UI réutilisables
│   └── ui/                 # shadcn/ui primitives
├── lib/                    # Utilitaires & clients
│   └── supabase/           # Client Supabase (server/client)
├── scanner/                # Moteur de scan
│   ├── checks/             # Vérifications individuelles
│   ├── scoring.ts          # Calcul du score
│   └── types.ts            # Types TypeScript
└── supabase/
    └── migrations/         # Migrations SQL
```

---

## ⚠️ Disclaimer

> CompliScore fournit un score **indicatif** basé sur des vérifications automatisées. Il ne constitue pas un audit légal ni une certification de conformité. Pour une analyse complète, consultez un expert juridique ou en cybersécurité.

---

## 📄 Licence

MIT © [Thoma Boudhou](https://thoma-boudhou.pages.dev)
