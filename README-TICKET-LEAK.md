# Bot Discord Complet FL-Leak

Ce bot combine 3 systèmes en un seul :
- 🔐 **Système de Vérification** - Vérification automatique des nouveaux membres
- 🎫 **Système de Tickets** - Gestion des tickets de support
- 📦 **Système de Leaks** - Partage de ressources (scripts, mappings, etc.)

## 🚀 Démarrage

Pour démarrer le bot, double-cliquez sur `start-ticket-leak-bot.bat` ou exécutez :
```bash
node ticket-leak-bot.js
```

## 📋 Fonctionnalités

### 1. Système de Vérification

Le bot vérifie automatiquement les nouveaux membres pour éviter les bots et les comptes malveillants.

#### Fonctionnement
1. Quand un membre rejoint le serveur, un salon privé est créé automatiquement
2. Le membre reçoit un bouton "Verify Now" pour se vérifier
3. Après vérification sur le site web, un webhook envoie la confirmation
4. Le bot attribue automatiquement le rôle configuré
5. Le salon de vérification est supprimé automatiquement

#### Commandes Vérification
- `!setup-verify_admin_rooooot` - Crée un message permanent de vérification (Admin uniquement)

#### Configuration
- **Salon webhook** : `1424036316189819050`
- **Rôle attribué** : Configuré dans `config.json` (roleId)
- **URL de vérification** : `https://discordverify.infinityfreeapp.com`

### 2. Système de Tickets

Le bot gère 5 types de tickets :
- ❓ **Question** - Pour poser des questions
- 💳 **Paiement & Boutique** - Pour les paiements VIP et boutique
- 📋 **Candidature & Recrutement** - Pour déposer une candidature
- ⚠️ **Signalement Staff** - Pour signaler un membre du staff
- 🚨 **Signalement Membre** - Pour signaler un membre

#### Commandes Tickets
- `+send_ticket_message` - Envoie le message avec les boutons pour créer des tickets (Admin uniquement)

#### Fonctionnement
1. L'utilisateur clique sur un bouton pour créer un ticket
2. Un salon privé est créé dans la catégorie appropriée
3. Le staff concerné est mentionné automatiquement
4. L'utilisateur peut fermer le ticket avec le bouton 🗑️ Close

### 3. Système de Leaks

Le bot permet de créer des leaks dans 5 catégories :
- 🖼️ **Pack Graphique**
- 🌐 **Base**
- 👕 **Pack de Vêtements**
- 📜 **Script**
- 🗺️ **Mapping**

#### Commande /leak

Seul le rôle avec l'ID `1303464707784704153` peut utiliser cette commande.

**Paramètres :**
- `nom` - Nom du leak
- `description` - Description du leak
- `type` - Type de leak (choix parmi les 5 catégories)
- `lien` - Lien de téléchargement
- `preview` - Lien de preview (image ou vidéo YouTube)

**Exemple :**
```
/leak nom:"Fivem Garage V7" description:"Mapping Garage" type:mapping lien:"https://..." preview:"https://youtube.com/..."
```

#### Fonctionnement des Leaks

1. Un salon est créé dans la catégorie correspondante
2. Le nom du salon suit le format : `[emoji]-nom-du-leak`
3. Un embed est créé avec :
   - Le nom et l'emoji du type
   - La description
   - L'image de preview (ou miniature YouTube)
4. Trois boutons sont ajoutés :
   - 📥 **Download** - Redirige vers le lien de téléchargement
   - 👁️ **Preview** - Redirige vers le preview
   - ⚠️ **Ne fonctionne plus** - Signale que le leak ne fonctionne plus

5. Un message de gestion est envoyé dans le salon `1303484319498637333` avec :
   - 🗑️ **Supprimer** - Pour supprimer le leak
   - ✏️ **Mettre à jour** - Pour mettre à jour le leak

#### Permissions des Salons de Leaks

Les utilisateurs peuvent :
- ✅ Voir le salon
- ✅ Cliquer sur les boutons
- ❌ Écrire des messages

### 3. Preview YouTube

Quand un lien YouTube est fourni dans le paramètre `preview`, le bot :
1. Extrait l'ID de la vidéo
2. Récupère automatiquement la miniature YouTube
3. L'affiche dans l'embed

## 🔧 Configuration

Les IDs sont configurés dans le fichier `ticket-leak-bot.js` :

### Catégories de Tickets
```javascript
TICKET_CATEGORIES = {
    "question": "1303486246730862613",
    "paiement": "1303486415522369577",
    "recrutement": "1303486530681180263",
    "staff": "1303486633399812137",
    "membre": "1303486706191699998"
}
```

### Catégories de Leaks
```javascript
LEAK_CATEGORIES = {
    "pack_graphique": "1322302187178692659",
    "base": "1304890672913973319",
    "pack_vetements": "1312422941488713729",
    "script": "1349813348136521810",
    "mapping": "1317463085434277999"
}
```

### Autres Configurations
- **Rôle autorisé pour /leak** : `1303464707784704153`
- **Salon de signalement** : `1303484319498637333`
- **Salon de recrutement** : `1303457194192404482`
- **Rôles mentionnés dans les tickets** :
  - Questions/Signalements : `1303464707784704153`
  - Paiements/Recrutements : `1303464584816099339`

## 📝 Notes

- Le bot synchronise automatiquement les commandes slash au démarrage
- Les tickets sont limités à 1 par utilisateur (toutes catégories confondues)
- Les recrutements peuvent être fermés en ajoutant 🔒 dans le nom du salon de recrutement
- Les leaks signalés sont envoyés dans le salon de gestion pour action

## ⚙️ Dépendances

Le bot utilise `discord.js` v14. Assurez-vous que toutes les dépendances sont installées :
```bash
npm install
```

## 🎨 Personnalisation

Vous pouvez personnaliser :
- Les couleurs des embeds
- Les emojis pour chaque type de leak
- Les messages et descriptions
- Les permissions des salons

Modifiez simplement les constantes au début du fichier `ticket-leak-bot.js`.
