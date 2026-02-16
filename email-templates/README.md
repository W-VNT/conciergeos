# 📧 Templates Email ConciergeOS

Templates HTML pour les emails d'authentification Supabase avec le thème noir/gris élégant de ConciergeOS.

## 📁 Fichiers

### Templates Supabase (à copier dans le dashboard)
- `supabase-confirm-signup.html` - Confirmation d'inscription
- `supabase-reset-password.html` - Réinitialisation de mot de passe
- `supabase-change-email.html` - Changement d'adresse email
- `supabase-magic-link.html` - Connexion sans mot de passe (Magic Link)

### Template application (référence seulement)
- `team-invitation.html` - Invitation d'équipe (déjà implémenté dans `/src/lib/email.ts`)

## 🔧 Installation dans Supabase

### 1. Accéder aux templates email

1. Va sur [supabase.com](https://supabase.com)
2. Sélectionne ton projet
3. **Authentication** → **Email Templates**

### 2. Configurer chaque template

Pour chaque type d'email :

#### **Confirm signup** (Confirmation d'inscription)
1. Clique sur "Confirm signup"
2. Ouvre le fichier `supabase-confirm-signup.html`
3. Copie tout le contenu
4. Colle dans l'éditeur Supabase
5. Clique "Save"

#### **Reset password** (Réinitialisation mot de passe)
1. Clique sur "Reset password"
2. Ouvre le fichier `supabase-reset-password.html`
3. Copie tout le contenu
4. Colle dans l'éditeur Supabase
5. Clique "Save"

#### **Change Email Address** (Changement d'email)
1. Clique sur "Change Email Address"
2. Ouvre le fichier `supabase-change-email.html`
3. Copie tout le contenu
4. Colle dans l'éditeur Supabase
5. Clique "Save"

#### **Magic Link** (Connexion sans mot de passe)
1. Clique sur "Magic Link"
2. Ouvre le fichier `supabase-magic-link.html`
3. Copie tout le contenu
4. Colle dans l'éditeur Supabase
5. Clique "Save"

## ✅ Variables Supabase

Les templates utilisent ces variables Supabase (ne pas les modifier) :
- `{{ .ConfirmationURL }}` - Lien de confirmation/action
- `{{ .Token }}` - Code de vérification (optionnel)
- `{{ .TokenHash }}` - Hash du token (optionnel)
- `{{ .SiteURL }}` - URL de votre application (optionnel)

## 🎨 Design

Tous les templates utilisent le thème noir/gris élégant de ConciergeOS :
- Background gradient noir (#0a0a0a → #1a1a1a)
- Header gradient gris foncé (#0f0f0f → #1f1f1f)
- Logo avec effet glassmorphism
- Boutons CTA noir élégant
- Icônes colorées selon le type d'email

## 🔒 Sécurité

Chaque template inclut :
- Messages de sécurité clairs
- Durée d'expiration des liens
- Instructions en cas de problème
- Lien alternatif texte brut

## 📝 Notes

### Email d'invitation d'équipe
- **Fichier de référence:** `team-invitation.html` (pour visualiser le design)
- **Implémentation:** Le template est déjà intégré dans `/src/lib/email.ts`
- **Statut:** ✅ Prêt à l'emploi - pas besoin de configuration supplémentaire
- **Test:** Va sur `/organisation` et invite un nouveau membre pour voir l'email en action
