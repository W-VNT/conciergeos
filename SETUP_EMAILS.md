# Configuration des Emails - ConciergeOS

Ce guide explique comment configurer les 3 types d'emails pour ConciergeOS.

## 📧 Les 3 types d'emails

1. **Email de confirmation** (`01-confirmation.html`) - Envoyé automatiquement par Supabase lors de l'inscription
2. **Email de bienvenue** (`02-bienvenue.html`) - Envoyé après confirmation du compte
3. **Email de réinitialisation** (`03-reset-password.html`) - Envoyé lors d'une demande de reset password

---

## ✅ Étape 1 : Configurer les emails Supabase (Confirmation + Reset Password)

Ces deux emails sont gérés directement par Supabase Auth.

### 1. Aller dans Supabase Dashboard

1. Ouvrir https://supabase.com/dashboard
2. Sélectionner votre projet **ConciergeOS**
3. Aller dans **Authentication** → **Email Templates**

### 2. Configurer "Confirm signup"

1. Cliquer sur **Confirm signup**
2. Copier le contenu de `email-templates/01-confirmation.html`
3. Coller dans l'éditeur Supabase
4. **Important** : Garder la variable `{{ .ConfirmationURL }}` telle quelle
5. Cliquer sur **Save**

### 3. Configurer "Reset Password"

1. Cliquer sur **Reset Password**
2. Copier le contenu de `email-templates/03-reset-password.html`
3. Coller dans l'éditeur Supabase
4. **Important** : Garder la variable `{{ .ConfirmationURL }}` telle quelle
5. Cliquer sur **Save**

✅ **C'est fait !** Ces deux emails fonctionneront automatiquement.

---

## 🚀 Étape 2 : Configurer l'email de bienvenue (2 options)

L'email de bienvenue ne peut pas être configuré directement dans Supabase car il n'est pas un email d'authentification. Vous avez 2 options :

### Option A : Edge Function + Resend API (Recommandé - Déjà créé)

J'ai déjà créé la Edge Function dans `supabase/functions/send-welcome-email/index.ts`.

**Avantages :**
- Automatique après confirmation
- Personnalisé avec le nom de l'utilisateur et de l'organisation
- Professionnel (via Resend)

**Étapes :**

#### 1. Créer un compte Resend

1. Aller sur https://resend.com
2. Créer un compte gratuit (100 emails/jour gratuits)
3. Vérifier votre domaine `conciergeos.com` (ou utiliser le sandbox pour tester)
4. Copier votre **API Key**

#### 2. Configurer l'API Key dans Supabase

```bash
# Dans votre terminal
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
```

#### 3. Déployer la Edge Function

```bash
# Déployer la fonction
npx supabase functions deploy send-welcome-email

# Vérifier le déploiement
npx supabase functions list
```

#### 4. Configurer le Webhook Supabase

1. Aller dans **Database** → **Webhooks**
2. Cliquer sur **Create a new webhook**
3. Configurer :
   - **Name**: `send-welcome-email`
   - **Table**: `auth.users`
   - **Events**: Cocher uniquement `UPDATE`
   - **Type**: `Supabase Edge Functions`
   - **Edge Function**: Sélectionner `send-welcome-email`
   - **Filters**: Ajouter un filtre sur `email_confirmed_at` (optionnel mais recommandé)
4. Cliquer sur **Create webhook**

✅ **Terminé !** L'email de bienvenue sera envoyé automatiquement après chaque confirmation.

---

### Option B : Désactiver l'email de bienvenue (Plus simple)

Si vous ne voulez pas configurer Resend pour l'instant, vous pouvez simplement ne pas envoyer d'email de bienvenue.

**Pour réactiver plus tard :**
- L'utilisateur aura déjà accès au dashboard après confirmation
- Vous pourrez toujours activer l'Option A plus tard

---

## 🧪 Tester les emails

### Test en local (avec Inbucket)

Supabase CLI utilise Inbucket pour capturer les emails en développement.

```bash
# Lancer Supabase localement
npx supabase start

# Ouvrir Inbucket dans le navigateur
open http://localhost:54324
```

Tous les emails envoyés en local apparaîtront dans Inbucket.

### Test en production

1. Créer un nouveau compte sur https://conciergeos.vercel.app/signup
2. Vérifier votre boîte mail (ou Resend Dashboard pour le bienvenue)
3. Cliquer sur le lien de confirmation
4. Vérifier que l'email de bienvenue arrive (si Option A activée)

---

## 📝 Variables disponibles dans les templates

### Email de confirmation (Supabase)
- `{{ .ConfirmationURL }}` - Lien de confirmation unique
- `{{ .Token }}` - Token de confirmation (si besoin)
- `{{ .TokenHash }}` - Hash du token
- `{{ .SiteURL }}` - URL de votre site

### Email de reset password (Supabase)
- `{{ .ConfirmationURL }}` - Lien de réinitialisation unique
- `{{ .Token }}` - Token de réinitialisation
- `{{ .TokenHash }}` - Hash du token
- `{{ .SiteURL }}` - URL de votre site

### Email de bienvenue (Edge Function)
Les variables sont injectées par la fonction TypeScript :
- `fullName` - Nom complet de l'utilisateur
- `orgName` - Nom de l'organisation

---

## 🎨 Personnalisation

Tous les templates utilisent le design system de ConciergeOS :

- **Couleur principale** : `#0a0a0a` (noir)
- **Couleur secondaire** : `#737373` (gris muted)
- **Arrière-plan** : `#fafafa`
- **Police** : System fonts (San Francisco, Segoe UI, Roboto)
- **Style** : Minimaliste, cohérent avec shadcn/ui

Pour modifier un template :
1. Éditer le fichier HTML dans `email-templates/`
2. Copier-coller dans Supabase Dashboard (pour confirmation/reset)
3. Ou redéployer la Edge Function (pour bienvenue)

---

## ⚡ Recommandations

### Pour la production :

1. **Utiliser un domaine personnalisé** avec Resend :
   - Vérifier `conciergeos.com`
   - Configurer SPF, DKIM, DMARC
   - Augmenter la délivrabilité

2. **Surveiller les emails** :
   - Resend Dashboard pour les métriques (taux d'ouverture, bounces)
   - Supabase Logs pour les erreurs de Edge Function

3. **Ajouter des liens de désabonnement** :
   - Requis par la loi pour les emails marketing
   - Pas nécessaire pour les emails transactionnels (confirmation, reset)

### Pour le développement :

1. **Utiliser Inbucket** :
   ```bash
   npx supabase start
   open http://localhost:54324
   ```

2. **Tester tous les flows** :
   - Inscription → Confirmation → Bienvenue
   - Reset password
   - Vérifier sur desktop et mobile (responsive)

---

## 🐛 Dépannage

### L'email de confirmation n'arrive pas

1. Vérifier les **Spam/Courrier indésirable**
2. Vérifier les logs Supabase : **Authentication** → **Logs**
3. Vérifier que l'email est bien configuré dans **Email Templates**

### L'email de bienvenue n'arrive pas (Option A)

1. Vérifier que la Edge Function est déployée :
   ```bash
   npx supabase functions list
   ```

2. Vérifier les logs de la fonction :
   ```bash
   npx supabase functions logs send-welcome-email
   ```

3. Vérifier le webhook dans **Database** → **Webhooks**

4. Vérifier que `RESEND_API_KEY` est bien configuré :
   ```bash
   npx supabase secrets list
   ```

### Erreur "Resend error" dans les logs

- Vérifier que votre API Key Resend est valide
- Vérifier que vous n'avez pas dépassé le quota (100/jour en gratuit)
- Vérifier que le domaine est vérifié (ou utiliser le sandbox)

---

## 🎯 Prochaines étapes

Après configuration des emails :

1. ✅ Tester le flow complet d'inscription
2. ✅ Vérifier la réception des 3 types d'emails
3. ✅ Tester sur mobile (responsive)
4. 🚀 Passer à la suite : `/forgot-password` page, profil utilisateur, etc.
