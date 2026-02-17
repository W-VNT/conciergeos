# ConciergeOS - Roadmap

## Version 2.0 - Fonctionnalités futures

### 1. Dashboard Personnalisable 📊

**Priorité : Moyenne**

Permettre aux utilisateurs de personnaliser leur dashboard en choisissant quels widgets afficher et comment les organiser.

#### Fonctionnalités

##### 1.1 Gestion des widgets
- **Toggle widgets** : Afficher/masquer chaque widget individuellement
  - Calendrier
  - Missions du jour
  - Incidents ouverts
  - Contrats expirant
  - Graphiques analytics (à venir)

- **Interface de configuration** :
  - Bouton "Personnaliser le dashboard" dans l'en-tête
  - Modal avec liste de checkboxes pour chaque widget
  - Aperçu en temps réel des changements

##### 1.2 Drag & Drop (Phase 2)
- Réorganiser les widgets par glisser-déposer
- Changer la taille des widgets (petit/moyen/grand)
- Grid layout flexible et responsive

##### 1.3 Préférences par rôle
- **ADMIN** : Tous les widgets disponibles par défaut
- **OPERATEUR** : Vue simplifiée (uniquement missions assignées)
- **Possibilité de créer des "vues prédéfinies"** par rôle

#### Implémentation technique

##### Base de données
```sql
-- Migration: user_preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dashboard_config JSONB NOT NULL DEFAULT '{
    "widgets": {
      "calendar": {"visible": true, "position": 1, "size": "medium"},
      "missions": {"visible": true, "position": 2, "size": "small"},
      "incidents": {"visible": true, "position": 3, "size": "small"},
      "contrats": {"visible": true, "position": 4, "size": "small"}
    },
    "layout": "grid"
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

##### Composants
- `DashboardCustomizer` : Modal de configuration
- `DashboardLayout` : Wrapper qui gère l'affichage des widgets selon config
- `WidgetContainer` : Wrapper pour chaque widget avec logique drag & drop

##### Server Actions
- `getUserPreferences(userId)` : Récupérer config utilisateur
- `updateUserPreferences(userId, config)` : Sauvegarder config
- `resetToDefault(userId)` : Restaurer config par défaut

#### Librairies recommandées
- **react-grid-layout** : Pour drag & drop et grid responsive
- **@dnd-kit** : Alternative moderne et accessible pour drag & drop
- **zustand** : State management léger pour la config du dashboard

#### Workflow utilisateur
1. Clic sur "⚙️ Personnaliser" dans le header du dashboard
2. Modal s'ouvre avec aperçu du dashboard actuel
3. Toggle checkboxes pour afficher/masquer widgets
4. Drag & drop pour réorganiser (Phase 2)
5. Clic "Enregistrer" → Sauvegarde dans `user_preferences`
6. Dashboard se met à jour en temps réel

---

### 2. Module Finance (En cours) 💰

**Priorité : Haute**

Voir le plan détaillé dans `/Users/william/.claude/plans/graceful-twirling-music.md`

#### Fonctionnalités principales
- Calcul automatique des commissions
- Suivi des factures prestataires
- Tableau de bord financier (CA, charges, marges)
- Export comptable (CSV, PDF)
- Revenus détaillés par logement

#### Statut
- ✅ Phase 1 : Base de données & Revenus (En cours)
- ⏳ Phase 2 : Page Finances & Revenus
- ⏳ Phase 3 : Factures Prestataires
- ⏳ Phase 4 : Export Comptable

---

### 3. Notifications & Alertes 🔔

**Priorité : Haute**

#### Fonctionnalités
- Notifications en temps réel (WebSocket ou Server-Sent Events)
- Alertes pour :
  - Nouveau incident critique
  - Mission à venir (1h avant)
  - Contrat expirant (7j avant)
  - Facture prestataire en attente
- Centre de notifications avec historique
- Préférences de notification par utilisateur

#### Implémentation
- Table `notifications` avec RLS
- Composant `NotificationCenter` dans header
- Badge avec nombre de notifications non lues
- Toast notifications pour événements urgents

---

### 4. Rapport Automatisés 📈

**Priorité : Moyenne**

#### Fonctionnalités
- Rapports hebdomadaires/mensuels automatiques par email
- Résumé des KPIs (missions, incidents, revenus)
- Graphiques et statistiques
- Export PDF professionnel avec logo

#### Implémentation
- Cron job Supabase Edge Functions
- Templates email avec Resend
- Génération PDF avec jsPDF ou Puppeteer
- Configuration dans les préférences utilisateur

---

### 5. Application Mobile (PWA) 📱

**Priorité : Basse**

#### Fonctionnalités
- Progressive Web App (PWA)
- Installation sur mobile (iOS/Android)
- Mode offline pour missions
- Notifications push natives
- Scan QR code pour missions

#### Implémentation
- Service Worker pour cache offline
- Manifest.json pour installation
- Push API pour notifications
- Capacitor.js pour features natives

---

### 6. Intégrations Externes 🔗

**Priorité : Moyenne**

#### Plateformes de réservation
- **Airbnb** : Import automatique des réservations
- **Booking.com** : Sync calendrier
- **VRBO/Abritel** : Import réservations

#### Outils de communication
- **WhatsApp Business API** : Messages automatiques
- **Twilio** : SMS notifications
- **Slack** : Alertes équipe

#### Comptabilité
- **Stripe** : Paiements en ligne
- **QuickBooks** : Export comptable
- **Pennylane** : Facturation FR

---

### 7. IA & Automatisation 🤖

**Priorité : Basse (Exploration)**

#### Fonctionnalités potentielles
- **Prédiction de revenus** : ML pour prévisions mensuelles
- **Détection d'anomalies** : Incidents récurrents, coûts inhabituels
- **Assistant virtuel** : Chatbot pour questions fréquentes
- **OCR Factures** : Scan et extraction automatique des données

#### Exploration
- OpenAI GPT pour assistant
- TensorFlow.js pour prévisions
- Tesseract.js pour OCR

---

## Priorisation

### Q1 2026
- ✅ Calendar Widget (Fait)
- ✅ Dashboard cliquable (Fait)
- 🔄 Module Finance (En cours)

### Q2 2026
- Dashboard personnalisable
- Notifications & Alertes
- Rapports automatisés

### Q3 2026
- Application Mobile (PWA)
- Intégrations plateformes réservation

### Q4 2026
- Intégrations outils externes
- IA & Automatisation (exploration)

---

## Notes

- Cette roadmap est indicative et peut évoluer selon les besoins
- Les priorités peuvent changer selon les retours utilisateurs
- Chaque feature majeure fera l'objet d'un plan détaillé avant implémentation

---

*Dernière mise à jour : 16 février 2026*
