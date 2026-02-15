# 📧 Configuration des Notifications Email

Les notifications email sont **pré-configurées** mais **désactivées par défaut**. Suivez ces étapes pour les activer.

## ✅ Ce qui est déjà fait

- ✅ Templates d'emails HTML/texte (`src/lib/email/templates.ts`)
- ✅ Fonction d'envoi d'email (`src/lib/email/sender.ts`)
- ✅ Triggers DB prêts pour les événements critiques
- ✅ Emails configurés pour :
  - Mission assignée → Email à l'opérateur
  - Incident critique → Email aux admins
  - Contrat expirant (< 7j) → Email aux admins
  - Invitation équipe → Email à l'invité

## 🚀 Activation en 5 étapes

### 1. Créer un compte Resend

1. Aller sur [resend.com](https://resend.com)
2. Créer un compte gratuit (100 emails/jour gratuits)
3. Obtenir votre **API Key**

### 2. Installer le SDK Resend

```bash
npm install resend
```

### 3. Configurer la clé API

Ajouter dans `.env.local` :

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
```

### 4. Vérifier votre domaine (Production)

**Option A - Domaine personnalisé (Recommandé):**
1. Dans le dashboard Resend, aller dans "Domains"
2. Ajouter votre domaine (ex: `yourdomain.com`)
3. Configurer les DNS records (SPF, DKIM, DMARC)
4. Modifier `src/lib/email/sender.ts` ligne 44:
   ```ts
   from: "ConciergeOS <noreply@yourdomain.com>"
   ```

**Option B - Domaine de test (Développement):**
- Utiliser `onboarding@resend.dev` (limité à votre email)
- Parfait pour tester

### 5. Activer l'envoi d'emails dans les triggers

Modifier les triggers dans `supabase/migrations/0024_notifications.sql` ou créer une nouvelle migration:

```sql
-- Exemple: Trigger pour envoyer un email lors d'un incident critique
CREATE OR REPLACE FUNCTION notify_critical_incident_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
  admin_email TEXT;
BEGIN
  IF NEW.severity = 'CRITIQUE' THEN
    -- Get all admin emails
    FOR admin_record IN
      SELECT p.id, au.email
      FROM profiles p
      JOIN auth.users au ON au.id = p.id
      WHERE p.organisation_id = NEW.organisation_id
        AND p.role = 'ADMIN'
    LOOP
      -- Call Edge Function to send email (voir section Edge Functions ci-dessous)
      -- OU utiliser pg_notify pour déclencher l'envoi depuis l'app
      PERFORM pg_notify('email_critical_incident', json_build_object(
        'to', admin_record.email,
        'incident_id', NEW.id
      )::text);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_critical_incident_email
AFTER INSERT ON incidents
FOR EACH ROW
EXECUTE FUNCTION notify_critical_incident_email();
```

## 🔧 Méthodes d'envoi

### Méthode 1: Depuis Server Actions (Recommandé)

Appeler directement `sendEmail()` dans vos server actions:

```ts
// src/lib/actions/incidents.ts
import { sendEmail } from "@/lib/email/sender";
import { criticalIncidentEmail } from "@/lib/email/templates";

export async function createIncident(data: IncidentFormData) {
  // ... créer l'incident ...

  if (data.severity === "CRITIQUE") {
    // Get admin emails
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("organisation_id", profile.organisation_id)
      .eq("role", "ADMIN");

    // Get emails from auth.users
    const { data: users } = await supabase.auth.admin.listUsers();
    const adminEmails = users.users
      .filter(u => admins?.some(a => a.id === u.id))
      .map(u => u.email);

    // Send emails
    for (const email of adminEmails) {
      await sendEmail({
        to: email,
        template: criticalIncidentEmail({
          adminName: "Admin", // Get from profile
          logementName: "...",
          description: data.description,
          incidentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/incidents/${incident.id}`,
        }),
      });
    }
  }
}
```

### Méthode 2: Depuis Supabase Edge Functions

Créer une Edge Function pour envoyer des emails en arrière-plan:

```bash
supabase functions new send-email
```

```ts
// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { to, type, data } = await req.json();

  // Send email using Resend
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
    },
    body: JSON.stringify({
      from: "ConciergeOS <noreply@yourdomain.com>",
      to,
      subject: data.subject,
      html: data.html,
    }),
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## 📋 Templates disponibles

| Template | Fichier | Événement |
|----------|---------|-----------|
| Mission assignée | `missionAssignedEmail()` | Nouvelle mission pour opérateur |
| Incident critique | `criticalIncidentEmail()` | Incident sévérité CRITIQUE |
| Contrat expirant | `contractExpiringEmail()` | Contrat < 7 jours avant expiration |
| Invitation équipe | `teamInvitationEmail()` | Nouvel membre invité |

## 🧪 Tester les emails

### En développement (sans Resend):

Les emails s'affichent dans la console:

```
⚠️ RESEND_API_KEY not configured. Email not sent: Nouvelle mission assignée
📧 Email preview: { to: '...', subject: '...', html: '...' }
```

### Avec Resend (domaine de test):

```env
RESEND_API_KEY=re_xxxxx
```

Les emails seront envoyés à votre adresse email uniquement.

## 🎯 Prochaines étapes

1. ✅ Configurer Resend + domaine
2. ✅ Activer l'envoi dans les server actions critiques
3. ⏳ (Optionnel) Créer Edge Function pour async email sending
4. ⏳ (Optionnel) Ajouter un système de queue (Bull/Redis) pour gros volumes

## 📚 Ressources

- [Resend Documentation](https://resend.com/docs)
- [Resend + Next.js Guide](https://resend.com/docs/send-with-nextjs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Email best practices](https://resend.com/blog/email-best-practices)

---

**Note:** Les notifications in-app fonctionnent déjà parfaitement. Les emails sont un complément pour les événements critiques.
