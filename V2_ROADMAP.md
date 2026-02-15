# ConciergeOS - Roadmap V2

> Features à implémenter APRÈS validation du MVP avec utilisateurs réels

---

## 🚀 V2 - Portails Externes (Section H)

### Portail Propriétaire
**Nouveau rôle:** `PROPRIETAIRE`

| Feature | Description |
|---------|-------------|
| Vue logements | Voir uniquement leurs biens (RLS par proprietaire_id) |
| Réservations & revenus | Calendrier des réservations, CA par bien |
| Historique missions | Voir missions effectuées (checkin, checkout, ménages) |
| Incidents & photos | Suivi des incidents résolus avec photos |
| Rapports mensuels | Dashboard simplifié avec KPIs |
| Accès lecture seule | Aucune création/modification possible |

### Portail Prestataire
**Nouveau rôle:** `PRESTATAIRE`

| Feature | Description |
|---------|-------------|
| Mes missions assignées | Voir uniquement les missions où ils sont assignés |
| Marquer mission terminée | Bouton terminer + upload photos du travail |
| Historique interventions | Liste de toutes leurs missions passées |
| Upload photos/factures | Joindre photos avant/après et factures |
| Calendrier personnel | Vue calendrier de leurs missions à venir |

**Architecture technique:**
```sql
-- Ajouter roles
ALTER TYPE user_role ADD VALUE 'PROPRIETAIRE';
ALTER TYPE user_role ADD VALUE 'PRESTATAIRE';

-- Lier users aux entités
ALTER TABLE proprietaires ADD COLUMN user_id UUID REFERENCES profiles(id);
ALTER TABLE prestataires ADD COLUMN user_id UUID REFERENCES profiles(id);
```

---

## 🎨 V2 - UX Améliorations (Section I)

| Feature | Priorité | Description |
|---------|----------|-------------|
| Recherche globale | Moyenne | Recherche unifiée dans la topbar (Cmd+K) - tous les items |
| Dark mode complet | Basse | Theme sombre avec toggle dans ApplicationSettings |
| Breadcrumbs | Basse | Navigation fil d'Ariane sur toutes les pages |
| Raccourcis clavier | Basse | Cmd+K recherche, N nouveau, etc. |
| Historique activité | Moyenne | Timeline des actions récentes par entité |
| Skeleton loading | Moyenne | États de chargement sur pages lentes |
| Infinite scroll | Basse | Alternative pagination sur listes |
| PWA | Haute | Offline mode, install prompt pour opérateurs terrain |
| Swipe gestures | Basse | Mobile: swipe mission = terminer |

---

## 🔧 V2 - Technique (Section J)

| Feature | Priorité | Description |
|---------|----------|-------------|
| Tests E2E | Moyenne | Playwright ou Cypress |
| CI/CD | Moyenne | GitHub Actions (lint, build, tests, deploy auto) |
| Monitoring | Moyenne | Sentry pour le tracking d'erreurs production |
| i18n | Basse | Internationalisation (FR/EN) |
| API publique | Basse | REST API pour intégrations tierces |
| Analytics | Moyenne | Posthog ou Plausible pour usage app |

---

## 📈 V2 - Logements Avancés (Section G)

| Feature | Priorité | Description |
|---------|----------|-------------|
| Tarification dynamique | Moyenne | Grille tarifaire par saison (haute/basse/moyenne) |
| Score qualité | Basse | Note automatique basée sur les avis voyageurs |
| Galerie photos publique | Basse | Photos ordonnées pour présentation |
| Upload photo par tâche | Basse | Photo avant/après pour chaque item de checklist |
| Templates checklist admin | Basse | Page admin pour créer/modifier templates |

---

## 💬 V2 - Communication Avancée (Section F)

| Feature | Priorité | Description |
|---------|----------|-------------|
| Templates messages | Moyenne | Messages pré-rédigés pour voyageurs (instructions, wifi) |
| SMS / WhatsApp | Basse | Envoi notifications par SMS/WhatsApp (Twilio) |
| Chat interne équipe | Basse | Discussion entre admin et opérateurs par mission/logement |
| Messagerie automatique | Moyenne | Envoi auto messages voyageurs (J-1, check-in, check-out) |

---

## 📦 V2 - Réservations Avancées (Section D - Phase 3)

| Feature | Priorité | Description |
|---------|----------|-------------|
| Revenus par logement | Moyenne | Breakdown CA par logement, par mois, par plateforme |
| Check-in en ligne | Basse | Formulaire public pour le voyageur (identité, heure) |
| Sync iCal automatique | Moyenne | Cron job pour sync auto toutes les X heures |
| Règlement intérieur digital | Basse | Signature électronique règlement par voyageur |

---

## 🏢 V2 - Propriétaires Avancés (Section C)

| Feature | Priorité | Description |
|---------|----------|-------------|
| Rapport mensuel PDF | Moyenne | Auto-généré : revenus, missions, incidents, photos |
| Historique facturation | Haute | Suivi commissions dues/payées par propriétaire |
| Fiche détaillée | Moyenne | IBAN, adresse postale, SIRET/société |
| Portail lecture | Basse | Accès propriétaire (voir biens, missions, revenus) |

---

## 📝 Notes d'implémentation

**Priorisation V2:**
1. Valider MVP pendant 2-3 mois avec vrais utilisateurs
2. Collecter feedback et métriques d'usage
3. Décider des features V2 basées sur demandes réelles
4. Éviter sur-engineering prématuré

**Estimation effort V2 complet:** 8-12 semaines
