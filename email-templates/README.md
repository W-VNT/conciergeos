# Email Templates - ConciergeOS

Templates d'emails HTML pour Supabase Auth.

## Templates disponibles

### 1. `01-confirmation.html` - Confirmation d'inscription
**Utilisé pour :** Vérification de l'email lors de la création d'un compte

**Variables Supabase :**
- `{{ .ConfirmationURL }}` - URL de confirmation (expire dans 24h)

**Déclencheur :** `signUp({ email, password })`

---

### 2. `02-bienvenue.html` - Email de bienvenue
**Utilisé pour :** Email post-confirmation pour accueillir le nouvel utilisateur

**Contenu :**
- Message de bienvenue
- Fonctionnalités principales (logements, propriétaires, missions, incidents)
- Lien vers le dashboard
- Contact support

**Déclencheur :** Après confirmation de l'email (webhook ou Edge Function)

---

### 3. `03-reset-password.html` - Réinitialisation mot de passe
**Utilisé pour :** Demande de réinitialisation de mot de passe

**Variables Supabase :**
- `{{ .ConfirmationURL }}` - URL de reset (expire dans 1h)

**Déclencheur :** `resetPasswordForEmail({ email })`

---

## Configuration Supabase

### Étape 1 : Accéder aux templates email

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet : `xhyoleegdoyxorgcjpiz`
3. Allez dans **Authentication** → **Email Templates**

### Étape 2 : Configurer chaque template

#### Confirmation Email (Signup)
1. Cliquez sur **"Confirm signup"**
2. **Subject :** `Confirmez votre email - ConciergeOS`
3. Copiez-collez le contenu de `01-confirmation.html`
4. Cliquez **Save**

#### Password Reset
1. Cliquez sur **"Reset password"**
2. **Subject :** `Réinitialisation de votre mot de passe - ConciergeOS`
3. Copiez-collez le contenu de `03-reset-password.html`
4. Cliquez **Save**

### Étape 3 : Email de bienvenue (optionnel)

L'email de bienvenue (`02-bienvenue.html`) nécessite une Edge Function ou un webhook Supabase pour être envoyé automatiquement après confirmation.

**Option A : Webhook (recommandé)**
1. Allez dans **Database** → **Webhooks**
2. Créez un webhook sur `auth.users` avec event `INSERT`
3. Envoyez l'email via un service tiers (SendGrid, Resend, etc.)

**Option B : Edge Function**
```typescript
// supabase/functions/send-welcome-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { record } = await req.json()

  if (record.email_confirmed_at) {
    // Envoyer l'email de bienvenue via SendGrid/Resend
  }

  return new Response(JSON.stringify({ ok: true }))
})
```

---

## Design

**Palette de couleurs :**
- Primary gradient : `#667eea` → `#764ba2`
- Texte principal : `#111827`
- Texte secondaire : `#6b7280`
- Background : `#f9fafb`

**Responsive :**
- Max-width : 600px
- Mobile-first avec media queries

**Icônes :**
- 🏢 Logo ConciergeOS
- 🏠 Logements
- 👥 Propriétaires
- 📋 Missions
- 🔧 Incidents

---

## Test des emails

### En local avec Inbucket (Supabase CLI)

```bash
npx supabase start
# Inbucket UI: http://localhost:54324
```

Tous les emails envoyés en local arrivent dans Inbucket.

### En production

1. Créez un compte test sur https://conciergeos.vercel.app/signup
2. Vérifiez votre boîte mail (pensez aux spams)
3. Testez le reset password depuis `/forgot-password`

---

## Variables disponibles dans les templates Supabase

| Variable | Description | Expire |
|----------|-------------|--------|
| `{{ .ConfirmationURL }}` | URL de confirmation/reset | 24h (signup), 1h (reset) |
| `{{ .Token }}` | Token brut (non recommandé) | - |
| `{{ .TokenHash }}` | Hash du token | - |
| `{{ .SiteURL }}` | URL du site (configurée dans Supabase) | - |
| `{{ .Email }}` | Email de l'utilisateur | - |

---

## Personnalisation supplémentaire

Pour personnaliser davantage :
1. Modifiez le HTML directement dans les fichiers
2. Testez en local avec Inbucket
3. Copiez-collez dans Supabase Dashboard
4. Testez en production avec un compte test

**Note :** Les changements dans les templates Supabase ne sont pas versionnés. Gardez toujours une copie locale (ce repo).
