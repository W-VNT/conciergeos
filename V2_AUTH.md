# Auth V2 — Roadmap

## Haute valeur

- [ ] **2FA / TOTP** — Google Authenticator / app compatible (Supabase MFA API `enroll`, `challenge`, `verify`)
- [ ] **Sessions actives** — Page "Appareils connectés" avec voir/révoquer (navigateur, OS, dernière activité)
- [ ] **Changement d'email** — Flow complet avec reconfirmation des deux adresses
- [ ] **OAuth social** — Google / Microsoft pour onboarding plus rapide (surtout propriétaires invités)
- [ ] **Transfert de rôle admin** — UI pour transférer le rôle ADMIN à un autre membre (pré-requis pour suppression compte admin)

## Moyenne valeur

- [ ] **Magic link login** — Alternative au mot de passe, utile pour les propriétaires qui se connectent rarement
- [ ] **Rate limiting côté client** — Compteur de tentatives sur login/forgot-password avec cooldown progressif (5 tentatives → 30s, 10 → 5min)
- [ ] **Audit log auth** — Table `auth_events` (login, password change, session revoked, account deleted) visible par l'admin dans /organisation
- [ ] **Verrouillage de compte** — Blocage temporaire après N échecs consécutifs (15min lockout)
- [ ] **Politique de mot de passe configurable** — L'admin choisit le niveau minimum (longueur, complexité) pour son organisation

## Nice-to-have

- [ ] **Remember me** — Choix durée de session (7j vs 30j vs "jusqu'à déconnexion")
- [ ] **Expiration de mot de passe** — Optionnel, forcer le changement tous les 90j (configurable par org)
- [ ] **Notification connexion suspecte** — Email si login depuis nouvel appareil / nouvelle localisation
- [ ] **Suppression d'organisation** — Flow complet (export données → confirmation → suppression cascade)
- [ ] **`next/image` pour avatars** — Config `remotePatterns` Supabase storage dans user-menu
