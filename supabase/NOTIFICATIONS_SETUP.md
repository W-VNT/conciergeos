# Configuration des Notifications

## 📋 État d'implémentation

### ✅ Complété

1. **Table de préférences** (Migration 0070)
   - Table `notification_preferences` créée
   - 14 types de notifications paramétrables
   - Valeurs par défaut appropriées

2. **Triggers automatiques**
   - ✅ **Mission assignée** (0071) - Vérifie les préférences avant envoi
   - ✅ **Incident ouvert** (0072) - Notifie admins/managers
   - ✅ **Incident assigné** (0072) - Notifie lors assignation prestataire
   - ✅ **Incident résolu** (0072) - Notifie admins/managers
   - ✅ **Réservation confirmée** (0073) - Notifie admins/managers

3. **Fonctions pour cron jobs**
   - ✅ `send_checkin_reminders()` - Rappels check-in 24h avant
   - ✅ `send_checkout_today_notifications()` - Notifications check-out du jour
   - ✅ `check_urgent_missions()` - Alertes missions urgentes non assignées
   - ✅ `check_critical_incidents()` - Alertes incidents critiques non résolus

### 🔧 Configuration requise

#### 1. Appliquer les migrations

```bash
cd /Users/william/Documents/GitHub/conciergeos
npx supabase db push
```

Cela appliquera les migrations :
- `0071_update_mission_trigger_with_preferences.sql`
- `0072_incident_notification_triggers.sql`
- `0073_reservation_notification_triggers.sql`
- `0074_alert_notification_functions.sql`

#### 2. Configurer les cron jobs Supabase

Dans le dashboard Supabase (Database → Cron Jobs), créer les tâches suivantes :

**a) Rappels check-in (quotidien à 8h00)**
```sql
SELECT cron.schedule(
  'checkin-reminders',
  '0 8 * * *',  -- Tous les jours à 8h00
  $$SELECT send_checkin_reminders()$$
);
```

**b) Notifications check-out (quotidien à 7h00)**
```sql
SELECT cron.schedule(
  'checkout-notifications',
  '0 7 * * *',  -- Tous les jours à 7h00
  $$SELECT send_checkout_today_notifications()$$
);
```

**c) Alertes missions urgentes (toutes les heures)**
```sql
SELECT cron.schedule(
  'urgent-missions-check',
  '0 * * * *',  -- Toutes les heures
  $$SELECT check_urgent_missions()$$
);
```

**d) Alertes incidents critiques (toutes les heures)**
```sql
SELECT cron.schedule(
  'critical-incidents-check',
  '0 * * * *',  -- Toutes les heures
  $$SELECT check_critical_incidents()$$
);
```

#### 3. Activer l'extension pg_cron

Si pas encore fait :

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

#### 4. Configuration de l'envoi d'emails

Actuellement, les triggers créent des notifications in-app et **loggent** les envois d'emails prévus, mais ne les envoient pas réellement (sauf pour les missions assignées qui utilisent une Edge Function).

**Options pour activer l'envoi d'emails :**

##### Option A : Créer les Edge Functions Supabase

Créer des Edge Functions dans `supabase/functions/` :
- `send-mission-email/` (existe déjà dans le trigger)
- `send-incident-email/`
- `send-reservation-email/`
- `send-alert-email/`

##### Option B : Utiliser un service d'emails

Intégrer un service comme Resend, SendGrid, ou Mailgun :

1. Ajouter les clés API dans `app_config`
2. Modifier les triggers pour appeler le service d'emails
3. Créer des templates d'emails

## 📊 Types de notifications

### Notifications automatiques (triggers DB)

| Type | Quand | Qui est notifié | Migration |
|------|-------|-----------------|-----------|
| Mission assignée | Assignation d'une mission | L'opérateur assigné | 0071 |
| Incident ouvert | Création d'incident | Admins + Gestionnaires | 0072 |
| Incident assigné | Assignation à prestataire | Admins + Gestionnaires | 0072 |
| Incident résolu | Résolution incident | Admins + Gestionnaires | 0072 |
| Réservation confirmée | Nouvelle réservation | Admins + Gestionnaires | 0073 |

### Notifications planifiées (cron jobs)

| Type | Fréquence | Qui est notifié | Fonction |
|------|-----------|-----------------|----------|
| Check-in imminent | Quotidien 8h | Admins + Gestionnaires | `send_checkin_reminders()` |
| Check-out du jour | Quotidien 7h | Admins + Gestionnaires | `send_checkout_today_notifications()` |
| Missions urgentes | Horaire | Admins + Gestionnaires | `check_urgent_missions()` |
| Incidents critiques | Horaire | Admins + Gestionnaires | `check_critical_incidents()` |

### À implémenter plus tard

- ⏳ Rappels de mission (24h avant)
- ⏳ Missions en retard (détection automatique)
- ⏳ Résumé quotidien (email de synthèse)
- ⏳ Résumé hebdomadaire (rapport statistiques)

## 🔍 Vérification

### Tester les préférences utilisateur

```sql
-- Voir les préférences d'un utilisateur
SELECT * FROM notification_preferences WHERE user_id = 'USER_ID';

-- Désactiver une notification pour tester
UPDATE notification_preferences
SET notify_mission_assigned = false
WHERE user_id = 'USER_ID';
```

### Tester les triggers

```sql
-- Assigner une mission (devrait créer notification)
UPDATE missions
SET assigned_to = 'OPERATOR_ID'
WHERE id = 'MISSION_ID';

-- Créer un incident (devrait notifier admins)
INSERT INTO incidents (organisation_id, logement_id, description, severity, status)
VALUES ('ORG_ID', 'LOGEMENT_ID', 'Test incident', 'HAUTE', 'OUVERT');
```

### Vérifier les cron jobs

```sql
-- Lister les cron jobs actifs
SELECT * FROM cron.job;

-- Voir l'historique d'exécution
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### Consulter les logs

```sql
-- Voir les notifications créées récemment
SELECT * FROM notifications
ORDER BY created_at DESC
LIMIT 20;

-- Compter par type
SELECT type, COUNT(*)
FROM notifications
GROUP BY type;
```

## 🚀 Prochaines étapes

1. ✅ Appliquer les migrations (0071 à 0074)
2. ⏳ Configurer les cron jobs dans Supabase
3. ⏳ Créer ou configurer le service d'envoi d'emails
4. ⏳ Tester chaque type de notification
5. ⏳ Implémenter les résumés quotidiens/hebdomadaires
6. ⏳ Créer des templates d'emails personnalisés

## 📝 Notes techniques

- Les triggers vérifient **toujours** les préférences avant d'envoyer des emails
- Les notifications in-app sont **toujours** créées (indépendamment des préférences email)
- Si aucune préférence n'existe pour un utilisateur, la valeur par défaut est `true`
- Les fonctions de cron évitent d'envoyer plusieurs fois la même alerte par jour
- Les logs PostgreSQL contiennent les traces d'envoi d'emails pour debug
