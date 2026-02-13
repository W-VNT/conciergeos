# ConciergeOS

Back-office premium pour conciergeries. MVP SaaS avec gestion de logements, missions, incidents et prestataires.

## Stack technique

- **Framework** : Next.js 14 (App Router) + TypeScript
- **UI** : TailwindCSS + shadcn/ui + Lucide React
- **Backend** : Supabase (Postgres, Auth, Storage)
- **Forms** : react-hook-form + zod
- **Data** : Server Actions + supabase-js (SSR)

## Fonctionnalites

- Auth email/password + auto-onboarding (creation org + profil admin)
- Multi-tenant avec RLS (Row Level Security) sur toutes les tables
- Roles : Admin (full access) / Operateur (acces restreint)
- CRUD complet : Logements, Proprietaires, Missions, Incidents, Prestataires
- Dashboard KPI : missions du jour, incidents ouverts, temps resolution moyen, couts
- Upload photos (Supabase Storage) sur logements, missions, incidents
- Automatisation : checkout termine -> creation auto mission menage (+2h, anti-doublon)
- Export CSV missions/incidents
- UI mobile-first pour usage terrain

## Installation locale

### Prerequisites

- Node.js 18+
- Un projet Supabase (gratuit sur [supabase.com](https://supabase.com))

### 1. Cloner le repo

```bash
git clone https://github.com/W-VNT/conciergeos.git
cd conciergeos
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Remplir `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
```

### 3. Appliquer les migrations SQL

Dans le **SQL Editor** de Supabase, executer dans l'ordre :

1. `supabase/migrations/0001_foundation.sql`
2. `supabase/migrations/0002_owners_properties.sql`
3. `supabase/migrations/0003_missions.sql`
4. `supabase/migrations/0004_incidents_providers.sql`
5. `supabase/migrations/0005_attachments_storage.sql`

### 4. Configurer le Storage

Dans Supabase Dashboard > Storage :

1. Creer un bucket **"attachments"** (prive)
2. Les policies RLS sont creees automatiquement par la migration 0005

### 5. Lancer le serveur

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

### 6. Premier utilisateur

1. Aller sur `/login`
2. Creer un compte (email + mot de passe)
3. Le systeme cree automatiquement une organisation + profil Admin

## Structure du projet

```
src/
  app/
    (auth)/login/          # Page de connexion
    (dashboard)/           # Layout avec sidebar + topbar
      dashboard/           # Dashboard KPI
      logements/           # CRUD logements
      proprietaires/       # CRUD proprietaires
      missions/            # CRUD missions
      incidents/           # CRUD incidents
      prestataires/        # CRUD prestataires
    api/storage/           # Proxy pour images privees
  components/
    forms/                 # Formulaires (react-hook-form + zod)
    layout/                # Sidebar, Topbar, MobileSidebar
    shared/                # Composants reutilisables (KPI, badges, etc.)
    ui/                    # Composants shadcn/ui
  lib/
    actions/               # Server Actions (CRUD)
    supabase/              # Client Supabase (server + client + middleware)
    auth.ts                # Helpers auth + onboarding
    schemas.ts             # Schemas Zod
  types/
    database.ts            # Types TS alignes avec la DB
supabase/
  migrations/              # SQL migrations
  seed.sql                 # Seed optionnel
```

## Automatisation

Quand une mission **CHECKOUT** passe au statut **TERMINE** :
- Un trigger Postgres cree automatiquement une mission **MENAGE**
- Programmee 2 heures apres la completion
- Anti-doublon : pas de creation si un menage existe deja dans les 24h pour ce logement

## Deploiement Vercel

```bash
npm install -g vercel
vercel
```

Variables d'environnement a configurer dans Vercel :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Permissions par role

| Action | Admin | Operateur |
|--------|-------|-----------|
| Logements (lecture) | Oui | Oui |
| Logements (CRUD) | Oui | Non |
| Proprietaires (lecture) | Oui | Oui |
| Proprietaires (CRUD) | Oui | Non |
| Prestataires (lecture) | Oui | Oui |
| Prestataires (CRUD) | Oui | Non |
| Missions (CRUD) | Oui | Oui |
| Missions (suppression) | Oui | Non |
| Incidents (CRUD) | Oui | Oui |
| Incidents (suppression) | Oui | Non |
