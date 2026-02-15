# ConciergeOS - Rapport de projet

## Statut actuel : MVP fonctionnel

---

## 📋 Architecture & Fonctionnement métier

### Système de forfaits propriétaires (STANDARD / VIP)

**Champ:** `proprietaires.service_level` (enum `service_level`)

**Fonctionnement actuel:**
- Champ **informatif** pour qualifier le niveau de service du propriétaire
- `STANDARD` : Service de base
- `VIP` : Service premium avec priorité

**Utilisation:**
- Affiché sur la fiche propriétaire et dans les listes
- Badge de couleur pour identification visuelle rapide
- **Actuellement sans impact fonctionnel** - prévu pour futures évolutions :
  - Tarification différenciée (commissions, frais)
  - Priorité sur l'assignation des missions
  - Rapports mensuels détaillés pour VIP
  - SLA garantis (temps de réponse incidents)

**Implémentation technique:**
```typescript
// src/types/database.ts
export type ServiceLevel = 'STANDARD' | 'VIP';

// Migration SQL
CREATE TYPE service_level AS ENUM ('STANDARD', 'VIP');
ALTER TABLE proprietaires ADD COLUMN service_level service_level DEFAULT 'STANDARD';
```

---

### Système d'offres logements (ESSENTIEL / SÉRÉNITÉ / SIGNATURE)

**Champ:** `logements.offer_tier` (enum `offer_tier`)

**Fonctionnement actuel:**
- Définit le **niveau de prestation** pour un logement spécifique
- `ESSENTIEL` : Service basique (check-in/out, ménage standard)
- `SÉRÉNITÉ` : Service intermédiaire (+ interventions, suivi renforcé)
- `SIGNATURE` : Service premium (tout inclus, conciergerie complète)

**Utilisation:**
- Affiché sur la fiche logement et dans les listes
- Badge de couleur pour identification visuelle
- **Actuellement sans impact fonctionnel** - prévu pour :
  - Grille tarifaire par offre
  - Services inclus automatiques (ex: SIGNATURE = intervention urgence 24/7)
  - Tarification ménage différenciée
  - Templates de messages personnalisés par offre

**Différence avec `service_level`:**
- `service_level` (proprietaire) = Niveau global du client
- `offer_tier` (logement) = Prestation spécifique par bien
- Un propriétaire VIP peut avoir des logements en offre ESSENTIEL ou SIGNATURE

**Implémentation technique:**
```typescript
// src/types/database.ts
export type OfferTier = 'ESSENTIEL' | 'SERENITE' | 'SIGNATURE';

// Migration SQL
CREATE TYPE offer_tier AS ENUM ('ESSENTIEL', 'SERENITE', 'SIGNATURE');
ALTER TABLE logements ADD COLUMN offer_tier offer_tier DEFAULT 'ESSENTIEL';
```

**Exemple d'usage futur:**
```typescript
// Calculer le prix d'une mission selon l'offre
const missionPrice = {
  ESSENTIEL: 50,
  SERENITE: 75,
  SIGNATURE: 120,
}[logement.offer_tier];
```

---

### Mobile First UX

**Approche responsive:**
- **Mobile First** : Design prioritaire pour mobile (320px+)
- **Breakpoints TailwindCSS** :
  - `sm:` 640px (tablette portrait)
  - `md:` 768px (tablette landscape)
  - `lg:` 1024px (desktop)
  - `xl:` 1280px (grand écran)

**Composants adaptatifs:**

1. **Navigation**
   - Mobile : Burger menu (Sheet) + topbar
   - Desktop : Sidebar fixe (256px) + topbar
   ```tsx
   // Sidebar cachée sur mobile, fixe sur desktop
   <aside className="hidden md:flex md:w-64 md:fixed" />

   // Burger menu visible uniquement mobile
   <Button className="md:hidden">
     <Menu />
   </Button>
   ```

2. **Grilles responsives**
   - Mobile : 1 colonne
   - Tablette : 2 colonnes
   - Desktop : 3-4 colonnes
   ```tsx
   // KPI cards dashboard
   <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

   // Formulaires
   <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
   ```

3. **Tables responsives**
   - Mobile : Cards empilées (+ lisible)
   - Desktop : Table classique
   ```tsx
   // Liste missions : affichage adaptatif
   {missions.map(mission => (
     <div className="block md:grid md:grid-cols-5 p-3 border rounded">
       {/* Contenu responsive */}
     </div>
   ))}
   ```

4. **Typography responsive**
   - Titres adaptés : `text-2xl md:text-3xl`
   - Espacement réduit mobile : `px-4 md:px-6`
   - Touch targets min 44x44px (Apple guidelines)

**Améliorations UX:**

1. **Loading states**
   - Skeleton screens pour données async
   - Spinners pour actions utilisateur
   - Toast notifications (sonner)

2. **Accessibility**
   - Labels sémantiques (aria-label)
   - Focus visible (ring-2)
   - Contraste WCAG AA minimum

3. **Performance**
   - Server Components (RSC) par défaut
   - Client Components uniquement si nécessaire
   - ISR (revalidate 30s) sur dashboard
   - Pagination sur toutes les listes

4. **Feedback utilisateur**
   - Toasts pour succès/erreur
   - États disabled sur boutons pending
   - Badges colorés (statuts, priorités)
   - Notifications temps réel (polling 30s)

**Points d'amélioration identifiés:**
- [ ] Skeleton loading sur pages lentes
- [ ] Infinite scroll sur listes (alternative pagination)
- [ ] PWA (offline mode, install prompt)
- [ ] Dark mode complet
- [ ] Swipe gestures mobile (ex: swipe mission = terminer)

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
- [x] Vue calendrier mensuelle (grille 6x7, navigation mois, filtres type/statut, lien sidebar)

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
- [x] Top 5 logements avec le plus d'incidents (widget dashboard)

### Pieces jointes & Export (Prompt 5)
- [x] Upload photos (Supabase Storage) sur logements, missions, incidents
- [x] Export CSV sur toutes les entites (proprietaires, logements, missions, prestataires, incidents)
- [x] API route protegee pour servir les fichiers storage

### Profil utilisateur & Equipe (Section B)
- [x] Page Mon profil avec tabs (Profil / Securite / Equipe)
- [x] Modification nom, telephone, upload avatar
- [x] Changement mot de passe
- [x] Gestion des membres (liste, invitation par email, suppression)
- [x] Table invitations avec statuts et page acceptation

### Contrats (Section C)
- [x] CRUD complet contrats
- [x] Types : EXCLUSIF / SIMPLE
- [x] Statuts : ACTIF / EXPIRE / RESILIE (mise a jour auto par trigger)
- [x] Upload documents contractuels (PDFs via attachments)
- [x] Alertes expiration (widget dashboard + indicateur liste)

### Logements - Ameliorations (Section G)
- [x] Capacite : bedrooms, beds, max_guests
- [x] Vue carte interactive (Mapbox, markers colores, popups)
- [x] Geocodage automatique (adresse -> GPS via Mapbox API)

### Reservations & Calendrier (Section D - Phase 1 & 2)
- [x] CRUD complet reservations (voyageur, dates, plateforme, montant)
- [x] Statuts : CONFIRMEE, ANNULEE, TERMINEE
- [x] Plateformes : Airbnb, Booking, Direct, Autre
- [x] Auto-creation missions (CHECKIN, CHECKOUT, MENAGE)
- [x] Page liste avec recherche et filtres
- [x] Fiche voyageur (nom, email, tel, nb personnes)
- [x] Sync iCal (import calendriers Airbnb/Booking via URL)
- [x] Calendrier multi-logements (vue mensuelle reservations + missions)
- [x] KPI Taux d'occupation (% jours occupes du mois)
- [x] KPI Revenus du mois (CA total reservations confirmees)

### Notifications (Section F - Phase 1)
- [x] Notifications in-app (table + triggers DB)
- [x] Cloche de notifications dans topbar (badge count non-lus)
- [x] Page /notifications complete (liste, marquer lu, supprimer)
- [x] Triggers automatiques :
  - Mission assignee → notif operateur
  - Mission urgente → notif admins
  - Incident critique → notif admins
  - Fonction helper contrats expirants (pour cron)
- [x] Templates d'emails HTML/texte (prets a activer)
- [x] Systeme d'envoi email via Resend (doc complete)
- [x] Documentation activation EMAIL_SETUP.md

---

## 2. Fonctionnalites manquantes

### B. Profil utilisateur & Equipe

**Implemente:**
- [x] Page "Mon profil" avec tabs (Profil / Securite / Equipe)
- [x] Modification nom, telephone
- [x] Upload avatar (bucket Supabase Storage, preview circulaire, max 2MB)
- [x] Changement mot de passe avec indicateur de force
- [x] Champs profiles : phone, avatar_url
- [x] Email affiche (read-only, depuis auth.users)
- [x] Gestion des membres (liste, avatars, roles, suppression avec protections)
- [x] Invitation par email (token UUID, expiration 7j, page acceptation, validations)
- [x] Table invitations avec statuts (PENDING, ACCEPTED, EXPIRED, CANCELLED)
- [x] Server actions team : getTeamMembers, inviteMember, cancelInvitation, removeMember

**A implementer (Basse priorite - Post-MVP):**

| Feature | Priorite | Description |
|---------|----------|-------------|
| Permissions granulaires | Basse | Permissions plus fines que ADMIN/OPERATEUR (DECISION: garder 2 roles pour MVP) |
| Journal d'activite utilisateur | Basse | Historique des actions par utilisateur (qui a fait quoi, quand) |

---

### C. Proprietaires & Contrats

**Implemente:**
- [x] Contrats / Mandats de gestion (CRUD complet)
- [x] Types de contrat : EXCLUSIF / SIMPLE
- [x] Statuts : ACTIF / EXPIRE / RESILIE (mise a jour automatique par trigger)
- [x] Champs : proprietaire, logement (optionnel), dates, taux commission, conditions
- [x] Page liste avec filtres et recherche
- [x] Formulaire creation/edition avec validation
- [x] Page detail avec infos complete
- [x] Documents contractuels (upload PDFs via module attachments, entity_type CONTRAT)
- [x] Alertes expiration contrats :
  - Widget dashboard montrant contrats expirant dans 30j (avec urgence <7j)
  - Indicateur visuel sur liste contrats (icone + jours restants)

**A implementer:**

| Feature | Priorite | Description |
|---------|----------|-------------|
| Historique facturation proprio | Haute | Suivi des commissions dues/payees par proprietaire |
| Rapport mensuel proprietaire | Moyenne | PDF auto-genere : revenus, missions effectuees, incidents, photos |
| Portail proprietaire (lecture) | Basse | Acces en lecture seule pour les proprietaires (voir leurs biens, missions, revenus) |
| Fiche detaillee proprietaire | Moyenne | Coordonnees bancaires (IBAN), adresse postale, SIRET/societe |

---

### D. Reservations & Calendrier

**Implemente (Phase 1):**
- [x] Module reservations (CRUD complet)
  - Table reservations avec champs: guest, dates, plateforme, montant
  - Plateformes: AIRBNB, BOOKING, DIRECT, AUTRE
  - Statuts: CONFIRMEE, ANNULEE, TERMINEE
  - Page liste avec recherche et filtres
  - Formulaire creation/edition avec validation
  - Page detail complete avec infos sejour
- [x] Auto-creation missions
  - CHECKIN (jour arrivee 15h)
  - CHECKOUT (jour depart 11h)
  - MENAGE (jour depart 13h, 2h apres checkout)
  - Creation automatique quand statut = CONFIRMEE
  - Anti-doublon (verifie si missions existent deja)
- [x] Fiche voyageur basique (nom, email, tel, nb personnes)

**Implemente (Phase 2):**
- [x] Sync iCal
  - Champs logements: ical_url, ical_last_synced_at (migration 0023)
  - Parsing iCal avec ical.js (VEVENT -> reservations)
  - Server actions: syncIcal(logementId), syncAllIcals()
  - Bouton sync sur page detail logement avec timestamp derniere sync
  - Creation/mise a jour reservations depuis calendrier externe
  - Gestion des doublons (check dates + logement)
- [x] Calendrier multi-logements
  - Page /calendrier mise a jour pour afficher reservations + missions
  - Reservations affichees comme blocs multi-jours (check-in -> check-out)
  - Missions affichees comme points colores
  - Filtre par statut reservation
  - Legende distinguant reservations (barres) et missions (points)
- [x] KPI Taux d'occupation
  - Calcul: jours occupes / jours disponibles du mois
  - Affichage dashboard avec pourcentage + details
  - Base: reservations confirmees du mois en cours
- [x] KPI Revenus du mois
  - Somme des montants reservations confirmees du mois
  - Affichage dashboard avec total en euros

**A implementer (Phase 3 - Post-MVP):**

| Feature | Priorite | Description |
|---------|----------|-------------|
| Revenus par logement | Moyenne | Breakdown CA par logement, par mois, par plateforme |
| Check-in en ligne | Basse | Formulaire public pour le voyageur (identite, heure arrivee) |
| Sync iCal automatique | Moyenne | Cron job pour sync automatique toutes les X heures |

---

### E. Finance & Facturation

**Implemente (Phase 1-2):**
- [x] Table `revenus` avec suivi detaille par reservation
- [x] **Calcul automatique des commissions** selon contrat actif (trigger DB)
- [x] **Auto-creation revenus** depuis reservations confirmees (trigger DB)
- [x] Vues agregees pour performance (revenus_mensuels, revenus_par_logement)
- [x] Page `/finances` dediee avec filtre de periode
- [x] **4 KPIs financiers**: CA Brut, Commissions, Charges, Marge nette
- [x] **Tableau revenus par logement** (nb reservations, CA brut, commissions %, CA net)
- [x] Commissions variables par contrat (12-20%)
- [x] Server actions pour recuperation donnees financieres
- [x] Navigation dans sidebar (icone DollarSign)

**A implementer:**

| Feature | Priorite | Description |
|---------|----------|-------------|
| Factures prestataires | Moyenne | Suivi des factures recues, liaison avec incidents/missions |
| Export comptable | Moyenne | Export CSV/PDF compatible logiciel comptable |
| Graphiques evolution | Moyenne | Charts mensuels avec recharts |
| Relances paiement | Basse | Alertes pour factures impayees |

---

### F. Communication & Notifications

**Implemente (Phase 1):**
- [x] Notifications in-app
  - Table notifications + enum notification_type (migration 0024)
  - Triggers DB automatiques (mission assignee, incident critique, mission urgente)
  - Composant NotificationBell dans topbar (badge count, dropdown)
  - Page /notifications complete (liste, marquer lu/supprimer, filtres)
  - Polling auto toutes les 30s pour mises a jour en temps reel
  - Format timestamp relatif (date-fns)
- [x] Notifications email (structure prete)
  - Templates HTML/texte (mission, incident, contrat, invitation)
  - Helper sendEmail() avec support Resend
  - Documentation complete EMAIL_SETUP.md
  - Desactive par defaut (activation facile via RESEND_API_KEY)

**A implementer:**

| Feature | Priorite | Description |
|---------|----------|-------------|
| Templates de messages | Moyenne | Messages pre-rediges pour voyageurs (instructions arrivee, wifi, etc.) |
| SMS / WhatsApp | Basse | Envoi de notifications par SMS ou WhatsApp (Twilio) |
| Chat interne equipe | Basse | Discussion entre admin et operateurs par mission/logement |

---

### G. Logements - Ameliorations

**Implemente:**
- [x] Capacite / Chambres (bedrooms, beds, max_guests)
  - Champs ajoutes a la table logements (migration 0018)
  - Formulaire avec validation Zod
  - Affichage page detail dans carte dediee
- [x] Vue carte des logements (Mapbox + react-map-gl)
  - Page /logements/carte avec carte interactive
  - Markers colores par statut (ACTIF=bleu, PAUSE=orange, ARCHIVE=gris)
  - Popups cliquables avec infos (nom, ville, offre, statut, capacite)
  - Navigation + controles carte
  - Stats affichees (nombre sur carte, sans coordonnees)
- [x] Geocodage automatique (Mapbox Geocoding API)
  - Bouton "Geolocaliser automatiquement" dans formulaire logement
  - Conversion adresse -> GPS coordinates sans saisie manuelle
  - Validation et affichage adresse trouvee
  - Champs latitude/longitude remplis automatiquement
- [x] Inventaire / Equipements (migration 0028)
  - Table equipements avec categories (ELECTROMENAGER, MOBILIER, LINGE, AUTRE)
  - États (BON, MOYEN, A_REMPLACER)
  - Composant InventaireSection sur page détail logement
  - CRUD complet avec dialog modal
  - Affichage groupé par catégorie
- [x] Checklist Ménage (migration 0029)
  - Tables checklist_templates, checklist_template_items, mission_checklist_items
  - Composant ChecklistManager sur page mission
  - Cocher/décocher tâches avec suivi de progression
  - Barre de progression (% complété)
  - Groupage par catégorie
- [x] Historique Maintenance
  - Composant HistoriqueMaintenance sur page logement
  - Timeline chronologique missions + incidents + réservations
  - Affichage des 20 derniers événements
  - Liens cliquables vers entités
  - Format relatif des dates (il y a X jours)

**A implementer:**

| Feature | Priorite | Description |
|---------|----------|-------------|
| Tarification | Moyenne | Grille tarifaire par saison (haute/basse/moyenne) |
| Score qualite | Basse | Note automatique basee sur les avis voyageurs |
| Galerie photos publique | Basse | Photos ordonnees pour presentation aux proprietaires/voyageurs |
| Upload photo par tâche checklist | Basse | Photo avant/après pour chaque item de checklist |
| Templates checklist admin | Basse | Page admin pour créer/modifier templates de checklist |

---

### H. Portails externes (V2 - Post-MVP)

**Decision MVP:** Les proprietaires et prestataires restent des **contacts** (tables separees), ils ne se connectent PAS au SaaS.
- Ils recoivent emails/SMS pour communication
- Seuls ADMIN et OPERATEUR (equipe conciergerie) se connectent

**Vision V2 (apres validation du MVP):** Ajouter des portails dedies avec authentification.

| Feature | Role | Description |
|---------|------|-------------|
| **Portail Proprietaire** | PROPRIETAIRE | Role additionnel pour les proprietaires qui veulent un acces |
| - Vue logements | PROPRIETAIRE | Voir uniquement leurs biens (RLS par proprietaire_id) |
| - Reservations & revenus | PROPRIETAIRE | Calendrier des reservations, CA par bien |
| - Historique missions | PROPRIETAIRE | Voir missions effectuees (checkin, checkout, menages) |
| - Incidents & photos | PROPRIETAIRE | Suivi des incidents resolus avec photos |
| - Rapports mensuels | PROPRIETAIRE | Dashboard simplifie avec KPIs |
| - Acces lecture seule | PROPRIETAIRE | Aucune creation/modification possible |
| **Portail Prestataire** | PRESTATAIRE | Role additionnel pour les prestataires actifs |
| - Mes missions assignees | PRESTATAIRE | Voir uniquement les missions ou ils sont assignes |
| - Marquer mission terminee | PRESTATAIRE | Bouton terminer + upload photos du travail |
| - Historique interventions | PRESTATAIRE | Liste de toutes leurs missions passees |
| - Upload photos/factures | PRESTATAIRE | Joindre photos avant/apres et factures |
| - Calendrier personnel | PRESTATAIRE | Vue calendrier de leurs missions a venir |

**Architecture technique V2:**
- Ajouter roles `PROPRIETAIRE` et `PRESTATAIRE` a l'enum `user_role`
- Lier `profiles.id` a `proprietaires.user_id` (nullable) et `prestataires.user_id` (nullable)
- Policies RLS adaptees : proprietaire voit que ses biens, prestataire que ses missions
- Dashboards specifiques par role (layout conditionnel)
- Invitations separees pour proprio vs prestataire

**Pourquoi attendre la V2:**
- **MVP = Valider l'outil interne** pour la conciergerie d'abord
- Tester 2-3 mois en prod pour identifier vrais besoins
- Economiser 3-4 semaines de dev complexe
- Eviter maintenance de portails peu utilises

---

### I. Ameliorations UX generales

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

### J. Ameliorations techniques

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
- [x] Page "Mon profil" + changement mot de passe
- [ ] Page Settings organisation
- [x] Gestion des membres (inviter operateurs)
- [x] Vue calendrier missions
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
