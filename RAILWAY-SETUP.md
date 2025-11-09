# 🚂 Configuration Railway pour FL-Leak Bot

## Variables d'environnement à configurer

Dans Railway, allez dans votre projet → **Variables** et ajoutez les variables suivantes :

### Variables obligatoires

| Variable | Valeur | Description |
|----------|--------|-------------|
| `DISCORD_TOKEN` | `MTM1MTY1ODczNzg3NzkwOTUzNA.GH5G1y.0JgKZn7cjgqgJRsX143UlmRnqLB06Y9DbOU2Zc` | Token du bot Discord |
| `ROLE_ID` | `1303466644269437039` | ID du rôle de vérification |

### Variables optionnelles

| Variable | Valeur | Description |
|----------|--------|-------------|
| `WEBHOOK_URL` | `https://discordapp.com/api/webhooks/1424036411576946739/T5NX2teOVBCfedvMQghKVz8gMQW77dF5z8gwMOy-VwKl9IvrPtR8apj32zOi591ltBjF` | URL du webhook Discord (optionnel) |

> **Note** : `CALLBACK_URL` et `CALLBACK_PORT` ne sont **pas nécessaires** pour `ticket-leak-bot.js`. Ces variables sont uniquement utilisées par `bot.js` si vous avez un serveur de vérification externe.

## 📝 Instructions de déploiement

### 1. Créer un nouveau projet Railway

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur **New Project**
3. Sélectionnez **Deploy from GitHub repo**
4. Choisissez votre repository

### 2. Configurer les variables d'environnement

1. Dans votre projet Railway, cliquez sur l'onglet **Variables**
2. Ajoutez les variables listées ci-dessus
3. Cliquez sur **Add Variable** pour chaque variable

### 3. Configuration du démarrage

Railway détectera automatiquement le `package.json` et utilisera :
```json
"start": "node ticket-leak-bot.js"
```

### 4. Déployer

1. Railway déploiera automatiquement après chaque push sur GitHub
2. Vérifiez les logs dans l'onglet **Deployments** → **View Logs**

## 🔒 Sécurité

⚠️ **IMPORTANT** : Ne commitez JAMAIS `config.json` avec des tokens réels sur GitHub !

Pour sécuriser votre bot :

1. Ajoutez `config.json` au `.gitignore` :
   ```
   config.json
   ```

2. Utilisez uniquement les variables d'environnement Railway pour la production

3. Gardez `config.json` uniquement pour le développement local

## 🐛 Dépannage

### Erreur "Unexpected end of JSON input"

✅ **Solution** : Le bot utilise maintenant les variables d'environnement. Assurez-vous que `DISCORD_TOKEN` et `ROLE_ID` sont définis dans Railway.

### Le bot ne démarre pas

1. Vérifiez les logs Railway : **Deployments** → **View Logs**
2. Assurez-vous que toutes les variables obligatoires sont définies
3. Vérifiez que le token Discord est valide

### Le bot se déconnecte immédiatement

- Vérifiez que le token Discord n'a pas expiré
- Régénérez le token sur le [Discord Developer Portal](https://discord.com/developers/applications)
- Mettez à jour la variable `DISCORD_TOKEN` dans Railway

## 📚 Ressources

- [Documentation Railway](https://docs.railway.app)
- [Discord.js Guide](https://discordjs.guide)
- [Discord Developer Portal](https://discord.com/developers/applications)
