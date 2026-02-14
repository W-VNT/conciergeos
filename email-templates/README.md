# Email Templates - ConciergeOS

Ce dossier contient les 3 templates d'emails pour ConciergeOS, stylisés pour correspondre au design du SaaS (shadcn/ui avec thème noir/gris/neutral).

## 📧 Les 3 templates

### 1. `01-confirmation.html` - Email de confirmation d'inscription
- Envoyé automatiquement par Supabase lors de l'inscription
- Configure dans Supabase Dashboard → Authentication → Email Templates → "Confirm signup"

### 2. `02-bienvenue.html` - Email de bienvenue
- Envoyé après confirmation du compte
- Nécessite une Edge Function (déjà créée dans `/supabase/functions/send-welcome-email/`)

### 3. `03-reset-password.html` - Email de réinitialisation de mot de passe
- Envoyé lors d'une demande de reset password
- Configure dans Supabase Dashboard → Authentication → Email Templates → "Reset Password"

---

## 📖 Guide de configuration complet

**👉 Voir [`SETUP_EMAILS.md`](../SETUP_EMAILS.md) pour les instructions détaillées de configuration.**

Ce guide contient :
- Configuration des templates Supabase (étape par étape)
- Déploiement de l'Edge Function pour l'email de bienvenue
- Configuration de Resend API
- Tests en local et en production
- Dépannage

---

## 🎨 Design System

Tous les templates suivent le design system de ConciergeOS :

- **Couleurs** :
  - Header : `#0a0a0a` (noir)
  - Texte muted : `#737373`
  - Arrière-plan : `#fafafa`
  - Bordures : `#e5e5e5`

- **Composants** :
  - Logo : 🏢 dans une box blanche
  - Boutons : Noirs avec hover
  - Layout responsive (max-width 600px)

---

## 📋 Variables disponibles

### Templates Supabase (01, 03)
- `{{ .ConfirmationURL }}` - Lien unique de confirmation/reset
- `{{ .Token }}`, `{{ .TokenHash }}`, `{{ .SiteURL }}`, etc.

### Email de bienvenue (02)
- `fullName` - Nom de l'utilisateur
- `orgName` - Nom de l'organisation

Variables injectées par `/supabase/functions/send-welcome-email/index.ts`
