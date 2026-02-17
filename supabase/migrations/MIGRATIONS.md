# Migrations History

Ce fichier documente l'historique des migrations de la base de données ConciergeOS.

## 📋 Structure

Les migrations sont numérotées séquentiellement : `XXXX_description.sql`

## 🗂️ Migrations Actives

### Foundation & Core (0001-0014)
- **0001** - Foundation : Tables de base (organisations, profiles)
- **0002** - Propriétaires & Logements
- **0003** - Missions
- **0004** - Incidents & Prestataires
- **0005** - Attachments & Storage
- **0006** - Fix onboarding RLS
- **0007** - Onboarding function
- **0008** - Seed demo data (initial)
- **0009** - Fix seed org
- **0010** - Debug data
- **0011** - Fix profiles RLS recursion
- **0012** - Performance indexes
- **0013** - Onboarding fields
- **0014** - Update onboarding function

### Features (0015-0024)
- **0015** - Profile fields (avatar_url)
- **0016** - Avatars bucket
- **0017** - Invitations system
- **0018** - Logement capacity
- **0019** - Logement coordinates
- **0020** - Contrats
- **0021** - Add contrat to entity_type
- **0022** - Reservations
- **0023** - iCal sync
- **0024** - Notifications

### Advanced Features (0028-0033)
- **0028** - Equipements
- **0029** - Checklists
- **0030** - Organisations bucket (logos)
- **0031** - Revenus (finance tracking)
- **0032** - Revenus triggers (auto-calculation)
- **0033** - Revenus views (monthly aggregates)

### Demo Data (0034-0037)
- **0034** - Seed finances test
- **0035** - Seed complete demo
- **0036** - Reseed function
- **0037** - Update seed function

### Invitations Enhancement (0040-0043)
- **0040** - Cleanup invitation constraints
- **0041** - Add invited_name to invitations
- **0042** - Update onboarding for invitations
- **0043** - Fix invitation onboarding (auto-accept via SQL trigger)

## 🗄️ Migrations Archivées

Les migrations suivantes ont été archivées car dupliquées :

- **0025** - profile_fields (duplicate de 0015)
- **0026** - avatars_bucket (duplicate de 0016)
- **0027** - invitations (duplicate de 0017)

Elles se trouvent dans `_archive/` pour référence.

## ⚠️ Notes Importantes

### Gaps de Numérotation
- **0038, 0039** - Non utilisés (gap intentionnel après consolidation)

### Migrations Seed
Les migrations 0008-0010 et 0034-0037 concernent des données de démonstration. Elles peuvent être ignorées en production.

Pour réinitialiser les données de démo :
```sql
SELECT reseed_demo_data();
```

### Ordre d'Exécution
Les migrations doivent être exécutées **dans l'ordre numérique strict**. Supabase gère cela automatiquement.

## 🔄 Processus de Migration

### Développement Local
```bash
supabase db reset  # Reset + run all migrations
```

### Production
Les migrations sont automatiquement appliquées lors du déploiement via Supabase CLI ou Dashboard.

## 📝 Convention de Nommage

Format : `XXXX_description_concise.sql`

- **XXXX** : Numéro séquentiel (4 chiffres, pad avec 0)
- **description** : Snake_case, descriptif court
- Exemple : `0044_add_payments_table.sql`

## 🚀 Prochaines Migrations Prévues

Voir `RAPPORT.md` Section E pour :
- Factures prestataires
- Export comptable
- Tableaux de bord financiers avancés
