# 🤖 Bots Discord FL-Leak

Ce projet contient plusieurs bots Discord pour gérer différentes fonctionnalités de votre serveur.

## 📦 Bots Disponibles

### 1. Bot Complet (RECOMMANDÉ) ⭐
**Fichier:** `ticket-leak-bot.js`  
**Démarrage:** `start-ticket-leak-bot.bat`

Ce bot combine toutes les fonctionnalités en un seul :
- ✅ Système de vérification automatique
- ✅ Système de tickets de support
- ✅ Système de leaks/ressources

**Avantages:**
- Un seul bot à gérer
- Utilise un seul token
- Toutes les fonctionnalités intégrées
- Plus facile à maintenir

👉 **Consultez `README-TICKET-LEAK.md` pour la documentation complète**

---

### 2. Bot de Vérification Simple
**Fichier:** `index.js`  
**Démarrage:** `node index.js`

Bot dédié uniquement à la vérification des nouveaux membres.

**Fonctionnalités:**
- Création automatique de salons de vérification
- Attribution automatique de rôle après vérification
- Suppression automatique des salons après vérification

---

### 3. Bots Alternatifs
**Fichiers:** `bot.js`, `bot-simple.js`

Versions alternatives avec des fonctionnalités spécifiques.

---

## 🚀 Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer le bot**
Éditez `config.json` avec vos informations :
```json
{
    "token": "VOTRE_TOKEN_BOT",
    "roleId": "ID_DU_ROLE_A_ATTRIBUER",
    "webhook": "URL_DU_WEBHOOK",
    "callbackUrl": "http://VOTRE_IP:3000",
    "callbackPort": 3000
}
```

3. **Démarrer le bot**
- **Windows:** Double-cliquez sur `start-ticket-leak-bot.bat`
- **Ligne de commande:** `node ticket-leak-bot.js`

---

## 📋 Configuration Requise

### Permissions Discord
Le bot nécessite les permissions suivantes :
- ✅ Manage Roles (Gérer les rôles)
- ✅ Manage Channels (Gérer les salons)
- ✅ Send Messages (Envoyer des messages)
- ✅ Embed Links (Intégrer des liens)
- ✅ Read Message History (Lire l'historique)
- ✅ View Channels (Voir les salons)

### Intents Discord
Les intents suivants doivent être activés dans le Developer Portal :
- ✅ Server Members Intent
- ✅ Message Content Intent
- ✅ Presence Intent (optionnel)

---

## 🔧 Commandes Disponibles

### Bot Complet (ticket-leak-bot.js)

#### Commandes Admin
- `!setup-verify_admin_rooooot` - Créer le message de vérification permanent
- `+send_ticket_message` - Créer le message de tickets avec boutons

#### Commandes Slash
- `/leak` - Créer un nouveau leak (réservé au staff)
  - **Paramètres:**
    - `nom` - Nom du leak
    - `description` - Description
    - `type` - Type (Pack Graphique, Base, Pack de Vêtements, Script, Mapping)
    - `lien` - Lien de téléchargement
    - `preview` - Lien de preview (image ou YouTube)

---

## 🎯 Utilisation

### Système de Vérification
1. Les nouveaux membres reçoivent automatiquement un salon privé
2. Ils cliquent sur "Verify Now" pour se vérifier
3. Le rôle est attribué automatiquement
4. Le salon est supprimé

### Système de Tickets
1. Envoyez le message de tickets avec `+send_ticket_message`
2. Les utilisateurs cliquent sur le bouton correspondant
3. Un salon privé est créé
4. Le staff est mentionné automatiquement
5. Fermeture avec le bouton 🗑️ Close

### Système de Leaks
1. Utilisez `/leak` pour créer un nouveau leak
2. Le salon est créé automatiquement dans la bonne catégorie
3. Les utilisateurs peuvent télécharger et voir le preview
4. Ils peuvent signaler si le leak ne fonctionne plus

---

## 🆔 IDs de Configuration

### Catégories de Tickets
```javascript
"question": "1303486246730862613"
"paiement": "1303486415522369577"
"recrutement": "1303486530681180263"
"staff": "1303486633399812137"
"membre": "1303486706191699998"
```

### Catégories de Leaks
```javascript
"pack_graphique": "1322302187178692659"
"base": "1304890672913973319"
"pack_vetements": "1312422941488713729"
"script": "1349813348136521810"
"mapping": "1317463085434277999"
```

### Autres
- **Rôle Staff Leak:** `1303464707784704153`
- **Salon Signalement:** `1303484319498637333`
- **Salon Recrutement:** `1303457194192404482`
- **Salon Webhook Vérification:** `1424036316189819050`

---

## 🐛 Dépannage

### Le bot ne démarre pas
- Vérifiez que le token dans `config.json` est correct
- Vérifiez que `node_modules` est installé (`npm install`)

### Le rôle n'est pas attribué
- Vérifiez que le bot a la permission "Manage Roles"
- Vérifiez que le rôle du bot est AU-DESSUS du rôle à attribuer
- Vérifiez l'ID du rôle dans `config.json`

### Les commandes slash ne s'affichent pas
- Attendez quelques minutes après le démarrage
- Redémarrez le bot
- Vérifiez les permissions du bot

### Les salons ne se créent pas
- Vérifiez que le bot a la permission "Manage Channels"
- Vérifiez les IDs des catégories dans le code

---

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs dans la console
2. Consultez la documentation complète dans `README-TICKET-LEAK.md`
3. Vérifiez que toutes les permissions sont correctes

---

## 📝 Notes Importantes

- ⚠️ **Ne partagez JAMAIS votre token Discord**
- ⚠️ Gardez `config.json` privé et sécurisé
- ⚠️ Faites des sauvegardes régulières de votre configuration
- ✅ Testez les fonctionnalités sur un serveur de test d'abord

---

## 🔄 Mises à Jour

Pour mettre à jour les dépendances :
```bash
npm update
```

Pour réinstaller complètement :
```bash
rm -rf node_modules
npm install
```

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2025  
**Auteur:** FL-Leak © 2024
