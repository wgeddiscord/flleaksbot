# Test du Système de Vérification

## Configuration
- **Salon webhook** : `1424036316189819050`
- **Rôle attribué** : `1303466644269437039`
- **Format du salon** : `username-verify`

## Format du message attendu

```
@Reverius
Embed:
  Title: "Nouvelle Vérification"
  Fields:
    - Utilisateur: @Reverius
    - ID: 712947058381684756
    - IP: 88.127.142.235
  Footer: "Système de Vérification"
```

## Processus de détection

1. ✅ Message détecté dans le salon `1424036316189819050`
2. ✅ Vérification que c'est un webhook ou un bot
3. ✅ Extraction de l'ID depuis :
   - La mention au-dessus de l'embed (`@Reverius`)
   - Le field "ID" dans l'embed (`712947058381684756`)
4. ✅ Attribution du rôle `1303466644269437039`
5. ✅ Recherche du salon `reverius-verify`
6. ✅ Suppression du salon

## Logs attendus dans la console

```
📨 Nouveau message de vérification détecté!
   ⏰ Date: ...
   📝 Contenu: @Reverius...
   🤖 Webhook ID: ...
   👤 Author: ...
   📋 Nombre d'embeds: 1
   📋 Embed 1:
      - Title: Nouvelle Vérification
      - Fields: 3
        • Utilisateur: @Reverius
        • ID: 712947058381684756
        • IP: 88.127.142.235
      - Footer: Système de Vérification
   🔍 ID trouvé dans la mention: 712947058381684756
   ✅ ID final utilisé: 712947058381684756

🆕 NOUVELLE VÉRIFICATION DÉTECTÉE!
👤 User ID: 712947058381684756
🎭 Rôle à attribuer: 1303466644269437039
⌛ Attribution en cours...
   📡 Serveur: ...
   ✓ Membre trouvé: Reverius#1234
   🎭 Attribution du rôle "..."...
   ✅ Rôle attribué avec succès!
   🔍 Recherche du salon: reverius-verify

🗑️ Suppression du salon de vérification: reverius-verify
   ✅ Salon supprimé avec succès
```

## Troubleshooting

### Le bot ne détecte pas le message
- Vérifier que le bot a l'intent `GuildMessages`
- Vérifier que le salon ID est correct : `1424036316189819050`
- Vérifier que le message vient d'un webhook ou d'un bot

### L'ID n'est pas extrait
- Vérifier le format de l'embed
- Vérifier que le field s'appelle "ID"
- Vérifier qu'il y a une mention dans le contenu

### Le rôle n'est pas attribué
- Vérifier que le rôle existe : `1303466644269437039`
- Vérifier que le bot a la permission `Manage Roles`
- Vérifier que le rôle du bot est au-dessus du rôle à attribuer

### Le salon n'est pas supprimé
- Vérifier que le salon existe avec le format `username-verify`
- Vérifier que le bot a la permission `Manage Channels`
- Vérifier les logs pour voir le nom recherché
