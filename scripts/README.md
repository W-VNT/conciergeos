# Scripts ConciergeOS

## Seed Data

### `seed-data.sql` - Données de démonstration

Ce script ajoute des données de test réalistes à votre compte ConciergeOS.

**Données insérées :**
- ✅ 5 propriétaires (Sophie Martin, Jean Dupont, Marie Lefebvre, Azur Invest, Pierre Moreau)
- ✅ 8 logements (Nice, Cannes, Antibes, Monaco, Menton, Grasse)
- ✅ 6 prestataires (ménage, plomberie, électricité, jardinage, climatisation)
- ✅ 17 missions (check-in, check-out, ménage, états des lieux)
- ✅ 8 incidents (fuites, pannes, problèmes divers)

**Comment utiliser :**

1. **Connectez-vous à Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/xhyoleegdoyxorgcjpiz/sql/new
   ```

2. **Copiez le contenu du fichier**
   ```bash
   cat scripts/seed-data.sql | pbcopy
   ```

3. **Collez dans le SQL Editor de Supabase**
   - Collez le code SQL
   - Cliquez sur **"Run"** (ou Ctrl+Enter)

4. **Vérifiez les résultats**
   - Vous devriez voir dans les logs :
     ```
     ✓ Inserted 5 proprietaires
     ✓ Inserted 8 logements
     ✓ Inserted 6 prestataires
     ✓ Inserted 17 missions
     ✓ Inserted 8 incidents
     🎉 Demo data seeded successfully!
     ```

5. **Rechargez votre dashboard**
   ```
   http://localhost:3002/dashboard
   ```

**Note :** Le script insère les données pour l'organisation la plus récente (votre compte). Si vous avez plusieurs comptes, il utilisera le dernier créé.

**Pour supprimer les données :**

Si vous voulez repartir de zéro, vous pouvez supprimer toutes les données :

```sql
-- ⚠️ ATTENTION : Ceci supprime TOUTES vos données !
DELETE FROM incidents;
DELETE FROM missions;
DELETE FROM logements;
DELETE FROM prestataires;
DELETE FROM proprietaires;
```

Puis relancez le script `seed-data.sql`.
