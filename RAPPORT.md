# ConciergeOS - Rapport de projet

## Statut actuel : MVP fonctionnel

---

## 1. Fonctionnalites implementees

### Fondation (Prompt 1)
- [x] Architecture Next.js 14 App Router + TypeScript
- [x] TailwindCSS + shadcn/ui + lucide-react
- [x] Supabase (Postgres, Auth, Storage)
- [x] Multi-tenant avec `organisation_id` et RLS
- [x] Authentification email/password
- [x] Auto-onboarding (creation org + profil admin au premier login)
- [x] Middleware de protection des routes
- [x] Roles ADMIN / OPERATEUR
- [x] Sidebar + Topbar responsive

### Proprietaires & Logements (Prompt 2)
- [x] CRUD complet proprietaires (nom, tel, email, niveau service STANDARD/VIP)
- [x] CRUD complet logements (adresse, offre ESSENTIEL/SERENITE/SIGNATURE, code boite a cles, wifi, notes)
- [x] Statuts logement : ACTIF / PAUSE / ARCHIVE
- [x] Liaison proprietaire <-> logement
- [x] Recherche et filtres sur les listes
- [x] Pagination

### Missions (Prompt 3)
- [x] CRUD complet missions
- [x] Types : CHECKIN, CHECKOUT, MENAGE, INTERVENTION, URGENCE
- [x] Statuts : A_FAIRE, EN_COURS, TERMINE, ANNULE
- [x] Priorites : NORMALE, HAUTE, CRITIQUE
- [x] Assignation a un operateur
- [x] Bouton "Terminer" rapide
- [x] Automatisation : CHECKOUT termine -> creation auto MENAGE (scheduled_at + 2h, anti-doublon +-24h)
- [x] Filtres par statut et type

### Prestataires & Incidents (Prompt 4)
- [x] CRUD prestataires (specialite, zone, taux horaire, score fiabilite 1-5)
- [x] Specialites : MENAGE, PLOMBERIE, ELECTRICITE, CLIM, AUTRE
- [x] CRUD incidents (severite, statut, description, cout, liaison logement/mission/prestataire)
- [x] KPI Dashboard :
  - Missions du jour
  - Incidents ouverts (dont critiques)
  - Resolution moyenne (30j)
  - Cout incidents (30j)
- [x] Listes missions du jour + incidents ouverts sur le dashboard

### Pieces jointes & Export (Prompt 5)
- [x] Upload photos (Supabase Storage) sur logements, missions, incidents
- [x] Export CSV sur toutes les entites (proprietaires, logements, missions, prestataires, incidents)
- [x] API route protegee pour servir les fichiers storage

---

## 2. Fonctionnalites manquantes

### A. Prompts non couverts (priorite immediate)

| Feature | Prompt | Description |
|---------|--------|-------------|
| Vue calendrier/agenda | Prompt 3 | Vue calendrier des missions (semaine/mois) en complement de la vue liste |
| Top 5 logements incidents | Prompt 4 | Widget dashboard : Top 5 logements avec le plus d'incidents |

---

### B. Profil utilisateur & Equipe

Le profil utilisateur est actuellement minimal (nom + role). Il manque :

| Feature | Priorite | Description |
|---------|----------|-------------|
| Page "Mon profil" | Haute | Voir/editer son nom, email, telephone, avatar |
| Changement mot de passe | Haute | Modifier son mot de passe depuis l'app |
| Photo de profil / avatar | Moyenne | Upload avatar, affiche dans la topbar et les assignations |
| Gestion des membres | Haute | Page admin pour inviter/supprimer des operateurs dans l'organisation |
| Invitation par email | Haute | Envoyer un lien d'invitation pour rejoindre l'organisation |
| Permissions granulaires | Moyenne | Permissions plus fines que ADMIN/OPERATEUR (ex: acces lecture seul sur finances) |
| Journal d'activite utilisateur | Basse | Historique des actions par utilisateur (qui a fait quoi, quand) |

---

### C. Proprietaires & Contrats

Le module proprietaires manque de profondeur pour un vrai usage metier :

| Feature | Priorite | Description |
|---------|----------|-------------|
| Contrats / Mandats de gestion | Haute | CRUD contrats : type (exclusif/simple), date debut/fin, taux commission, conditions |
| Statut contrat | Haute | ACTIF / EXPIRE / RESILIE avec alertes d'expiration |
| Documents contractuels | Haute | Upload PDF des mandats signes, avenants, etats des lieux |
| Historique facturation proprio | Haute | Suivi des commissions dues/payees par proprietaire |
| Rapport mensuel proprietaire | Moyenne | PDF auto-genere : revenus, missions effectuees, incidents, photos |
| Portail proprietaire (lecture) | Basse | Acces en lecture seule pour les proprietaires (voir leurs biens, missions, revenus) |
| Fiche detaillee proprietaire | Moyenne | Coordonnees bancaires (IBAN), adresse postale, SIRET/societe |

---

### D. Reservations & Calendrier

Absent du MVP, c'est pourtant le coeur du metier :

| Feature | Priorite | Description |
|---------|----------|-------------|
| Module reservations | Haute | CRUD reservations : voyageur, dates arrivee/depart, plateforme, montant |
| Sync iCal | Haute | Import automatique des calendriers Airbnb/Booking via URL iCal |
| Calendrier multi-logements | Haute | Vue calendrier avec toutes les reservations par logement |
| Taux d'occupation | Haute | KPI : taux d'occupation par logement, par mois |
| Revenus par logement | Haute | Suivi CA par bien, par mois, par plateforme |
| Auto-creation missions | Moyenne | Reservation creee -> auto-generer CHECKIN + CHECKOUT + MENAGE |
| Fiche voyageur | Moyenne | Nom, telephone, email, nombre de personnes, notes |
| Check-in en ligne | Basse | Formulaire public pour le voyageur (identite, heure arrivee) |

---

### E. Finance & Facturation

Aucun module financier actuellement :

| Feature | Priorite | Description |
|---------|----------|-------------|
| Suivi revenus par logement | Haute | CA brut par reservation, commissions, charges |
| Commissions conciergerie | Haute | Calcul automatique selon le contrat/mandat du proprietaire |
| Factures prestataires | Moyenne | Suivi des factures recues, liaison avec incidents/missions |
| Tableau de bord financier | Moyenne | CA total, charges, marge, par mois/trimestre |
| Export comptable | Moyenne | Export CSV/PDF compatible logiciel comptable |
| Relances paiement | Basse | Alertes pour factures impayees |

---

### F. Communication & Notifications

| Feature | Priorite | Description |
|---------|----------|-------------|
| Notifications in-app | Haute | Cloche de notifications : nouveau incident, mission assignee, contrat expirant |
| Notifications email | Haute | Emails automatiques pour les evenements critiques |
| Templates de messages | Moyenne | Messages pre-rediges pour voyageurs (instructions arrivee, wifi, etc.) |
| SMS / WhatsApp | Basse | Envoi de notifications par SMS ou WhatsApp (Twilio) |
| Chat interne equipe | Basse | Discussion entre admin et operateurs par mission/logement |

---

### G. Logements - Ameliorations

| Feature | Priorite | Description |
|---------|----------|-------------|
| Inventaire / Equipements | Moyenne | Liste du mobilier, electromenager, linge par logement |
| Checklist menage | Moyenne | Liste de taches standardisee par logement (personnalisable) |
| Capacite / Chambres | Haute | Nombre de chambres, lits, capacite max voyageurs |
| Tarification | Moyenne | Grille tarifaire par saison (haute/basse/moyenne) |
| Score qualite | Basse | Note automatique basee sur les avis voyageurs |
| Historique maintenance | Moyenne | Timeline de toutes les interventions/incidents par logement |
| Galerie photos publique | Basse | Photos ordonnees pour presentation aux proprietaires/voyageurs |

---

### H. Ameliorations UX generales

| Feature | Priorite | Description |
|---------|----------|-------------|
| Page Settings organisation | Haute | Nom, logo, adresse de la conciergerie |
| Recherche globale | Moyenne | Recherche unifiee dans la topbar (Cmd+K) |
| Dark mode | Basse | Theme sombre |
| Dashboard filtres dates | Moyenne | Selectionner la periode pour les KPIs (7j, 30j, 90j, custom) |
| Historique activite | Moyenne | Timeline des actions recentes par entite |
| Breadcrumbs | Basse | Navigation fil d'Ariane |
| Raccourcis clavier | Basse | Cmd+K recherche, N nouveau, etc. |

---

### I. Ameliorations techniques

| Feature | Priorite | Description |
|---------|----------|-------------|
| PWA / Mobile | Haute | Progressive Web App pour utilisation terrain (operateurs) |
| Tests E2E | Moyenne | Playwright ou Cypress |
| CI/CD | Moyenne | GitHub Actions (lint, build, tests, deploy auto) |
| Monitoring | Moyenne | Sentry pour le tracking d'erreurs production |
| i18n | Basse | Internationalisation (FR/EN) |
| API publique | Basse | REST API pour integrations tierces |

---

## 3. Performance - Analyse et recommandations

### Constat
L'application est perceptiblement lente, surtout en mode developpement.

### Causes identifiees

**En dev (localhost) :**
- Next.js compile les pages a la demande (compilation JIT) -> 500ms-2s par premiere visite
- Chaque navigation declenche une recompilation des server components
- Pas de cache -> chaque page fait 3-6 requetes Supabase

**En general :**
- Le dashboard fait 5 requetes Supabase sequentielles (missions, incidents, incidents critiques, resolution, couts)
- Supabase free tier : latence ~50-100ms par requete (serveur eu-west)
- Les server components re-fetchent toutes les donnees a chaque navigation

### Recommandations d'optimisation

| Priorite | Action | Impact estime |
|----------|--------|---------------|
| 1 | Deployer sur Vercel (production build) | -70% temps de chargement (pas de compilation JIT) |
| 2 | Paralleliser les requetes dashboard avec `Promise.all()` | -60% sur le dashboard |
| 3 | Ajouter `revalidate` sur les pages liste (ISR 30s) | Cache cote serveur, pages quasi-instantanees |
| 4 | Utiliser `loading.tsx` (Suspense) par section | Affichage progressif, UX percue amelioree |
| 5 | Creer une vue SQL materialise pour les KPIs dashboard | 1 requete au lieu de 5 |
| 6 | Passer a Supabase Pro (plan payant) | Latence DB reduite, connexions poolees |

---

## 4. Roadmap suggeree

### Phase 1 - Stabilisation MVP (1-2 semaines)
- [ ] Optimisation performance (Promise.all, loading.tsx)
- [ ] Page "Mon profil" + changement mot de passe
- [ ] Page Settings organisation
- [ ] Gestion des membres (inviter operateurs)
- [ ] Vue calendrier missions
- [ ] Top 5 logements incidents (dashboard)
- [ ] Deploy Vercel stable

### Phase 2 - Reservations & Contrats (2-3 semaines)
- [ ] Module reservations (CRUD + fiche voyageur)
- [ ] Sync iCal (Airbnb/Booking)
- [ ] Calendrier multi-logements
- [ ] Contrats/mandats de gestion
- [ ] Auto-creation missions depuis reservations
- [ ] KPI taux d'occupation + revenus

### Phase 3 - Finance & Communication (2-3 semaines)
- [ ] Suivi revenus par logement
- [ ] Commissions conciergerie
- [ ] Notifications in-app + email
- [ ] Templates messages voyageurs
- [ ] Rapport mensuel proprietaire (PDF)
- [ ] Export comptable

### Phase 4 - Operationnel avance (2-3 semaines)
- [ ] PWA mobile pour operateurs terrain
- [ ] Checklist menage par logement
- [ ] Inventaire equipements
- [ ] Historique maintenance par logement
- [ ] Check-in en ligne voyageur
- [ ] Chat interne equipe

---

## 5. Stack technique

| Composant | Technologie | Version |
|-----------|------------|---------|
| Framework | Next.js (App Router) | 14.2.35 |
| Langage | TypeScript | 5.x |
| UI | TailwindCSS + shadcn/ui | 3.4 / latest |
| Icones | lucide-react | latest |
| BDD | Supabase (PostgreSQL) | Cloud |
| Auth | Supabase Auth | Email/password |
| Storage | Supabase Storage | Bucket prive |
| Formulaires | react-hook-form + zod | latest |
| Deploiement | Vercel | - |

---

## 6. Base de donnees

### Tables actuelles
- `organisations` - Multi-tenant
- `profiles` - Utilisateurs (lie a auth.users)
- `proprietaires` - Proprietaires de biens
- `logements` - Biens en gestion
- `missions` - Taches planifiees
- `prestataires` - Fournisseurs de services
- `incidents` - Problemes et sinistres
- `attachments` - Pieces jointes (photos)

### Tables a creer
- `contrats` - Mandats de gestion (proprio <-> conciergerie)
- `reservations` - Reservations voyageurs
- `voyageurs` - Fiches voyageurs
- `revenus` - Suivi financier par reservation
- `notifications` - Notifications in-app
- `activity_logs` - Journal d'activite
- `checklists` - Modeles de checklists par logement
- `inventaires` - Equipements par logement

### Securite
- RLS (Row Level Security) sur toutes les tables
- Isolation par `organisation_id`
- Fonctions `SECURITY DEFINER` pour l'onboarding et l'automatisation
- Roles ADMIN (CRUD complet) et OPERATEUR (lecture + missions/incidents)

### Donnees de demo
- 5 proprietaires (3 VIP, 2 Standard)
- 8 logements (Nice, Cannes, Antibes, Monaco, Villefranche)
- 6 prestataires (menage, plomberie, electricite, clim, multi-services)
- 17 missions (4 aujourd'hui, mix de tous les types/statuts)
- 8 incidents (4 ouverts dont 1 critique, 4 resolus avec couts)

---

## 7. Repo & Deploiement

- **GitHub** : W-VNT/conciergeos
- **Supabase** : xhyoleegdoyxorgcjpiz (eu-west)
- **Vercel** : A redeployer apres stabilisation locale
- **Migrations** : 11 fichiers SQL (supabase/migrations/)
