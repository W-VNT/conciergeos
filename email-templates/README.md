# Email Templates Supabase

Ces templates HTML doivent être configurés dans le **Supabase Dashboard**.

## 📍 Où configurer les templates

1. Va sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionne ton projet **ConciergeOS**
3. Va dans **Authentication** > **Email Templates**

## 📧 Templates disponibles

### 1. Confirm signup (Confirmation d'email)
**Fichier:** `supabase-confirm-signup.html`

**Quand utilisé:** Lorsqu'un utilisateur s'inscrit et doit confirmer son email.

**Variables Supabase:**
- `{{ .ConfirmationURL }}` - Lien de confirmation

**Comment configurer:**
1. Dans Supabase Dashboard > Email Templates
2. Sélectionne "Confirm signup"
3. Copie-colle le contenu de `supabase-confirm-signup.html`
4. Clique sur "Save"

---

### 2. Reset Password (Réinitialisation mot de passe)
**Fichier:** `supabase-reset-password.html`

**Quand utilisé:** Lorsqu'un utilisateur demande à réinitialiser son mot de passe.

**Variables Supabase:**
- `{{ .ConfirmationURL }}` - Lien de réinitialisation

**Comment configurer:**
1. Dans Supabase Dashboard > Email Templates
2. Sélectionne "Reset Password"
3. Copie-colle le contenu de `supabase-reset-password.html`
4. Clique sur "Save"

---

### 3. Magic Link (Connexion magique) - OPTIONNEL
**Fichier:** `supabase-magic-link.html`

**Quand utilisé:** Si tu actives l'authentification par magic link (connexion sans mot de passe).

**Variables Supabase:**
- `{{ .ConfirmationURL }}` - Lien de connexion

**Comment configurer:**
1. Dans Supabase Dashboard > Email Templates
2. Sélectionne "Magic Link"
3. Copie-colle le contenu de `supabase-magic-link.html`
4. Clique sur "Save"

---

### 4. Invite User (Invitation utilisateur)
**Fichier:** `supabase-invite-user.html`

**Quand utilisé:** Lorsqu'un utilisateur est invité via Supabase (alternative au système custom).

**Variables Supabase:**
- `{{ .ConfirmationURL }}` - Lien d'acceptation d'invitation
- `{{ .InvitedByEmail }}` - Email de la personne qui invite

**Comment configurer:**
1. Dans Supabase Dashboard > Email Templates
2. Sélectionne "Invite User"
3. Copie-colle le contenu de `supabase-invite-user.html`
4. Clique sur "Save"

**Note:** Tu utilises déjà un système d'invitation custom via `sendInvitationEmail()`, mais ce template assure la cohérence visuelle si tu utilises aussi l'invitation Supabase native.

---

### 5. Change Email Address (Changement d'adresse email)
**Fichier:** `supabase-change-email.html`

**Quand utilisé:** Lorsqu'un utilisateur change son adresse email et doit confirmer la nouvelle.

**Variables Supabase:**
- `{{ .ConfirmationURL }}` - Lien de confirmation du changement
- `{{ .Email }}` - Nouvelle adresse email
- `{{ .NewEmail }}` - Nouvelle adresse email (alternative)

**Comment configurer:**
1. Dans Supabase Dashboard > Email Templates
2. Sélectionne "Change Email Address"
3. Copie-colle le contenu de `supabase-change-email.html`
4. Clique sur "Save"

---

## 🎨 Design

Tous les templates utilisent le même design que l'email d'invitation :
- ✅ Fond clair (#f5f5f5)
- ✅ Largeur 480px
- ✅ Header noir avec logo ConciergeOS
- ✅ Boutons CTA noirs
- ✅ Card d'information grise
- ✅ Notice de sécurité rouge clair

## 🔒 Sécurité

Chaque template inclut :
- Un badge indiquant le type d'email
- Le lien d'action principal (bouton)
- Le lien en clair (pour copier-coller si besoin)
- Une notice de sécurité avec expiration du lien

## ⚙️ Variables Supabase disponibles

Les templates Supabase peuvent utiliser ces variables :

### Confirm Signup & Magic Link & Reset Password
- `{{ .ConfirmationURL }}` - URL de confirmation/réinitialisation/connexion
- `{{ .Token }}` - Token (si tu veux l'afficher séparément)
- `{{ .Email }}` - Email de l'utilisateur
- `{{ .SiteURL }}` - URL de ton site

### Invite User & Change Email
- `{{ .ConfirmationURL }}` - URL d'acceptation/confirmation
- `{{ .InvitedByEmail }}` - Email de la personne qui invite (Invite User seulement)
- `{{ .Email }}` / `{{ .NewEmail }}` - Email (Change Email seulement)

## 📝 Test

Après configuration, teste chaque template :

1. **Confirm signup:** Crée un nouveau compte
2. **Reset password:** Clique sur "Mot de passe oublié" sur `/login`
3. **Magic link:** Si activé, utilise la connexion par email
4. **Invite user:** Invite un utilisateur via Supabase (ou utilise ton système custom)
5. **Change email:** Modifie l'email dans les paramètres du compte

## 🚀 Déploiement

Les templates sont configurés côté Supabase, pas dans le code. Aucun déploiement n'est nécessaire après modification.

Les changements sont **instantanés** dès que tu cliques sur "Save" dans le dashboard Supabase.
