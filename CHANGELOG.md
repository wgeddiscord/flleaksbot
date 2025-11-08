# Changelog - Bot FL-Leak

## Version 1.3.0 - Modération des liens, commande Help et Auto-suppression

### 🔗 Système de Modération des Liens
Le bot surveille maintenant tous les messages et applique les règles suivantes :

#### Règles de liens
- ✅ **Liens YouTube** : Autorisés pour tout le monde
- ✅ **Salons de tickets** : Tous les liens sont autorisés
- ✅ **Rôle Staff** (`1303464707784704153`) : Peut envoyer tous types de liens
- ❌ **Autres utilisateurs** : Ne peuvent pas envoyer de liens (sauf YouTube)

#### Détection spéciale
- Les liens Discord mal formés (`discord.gg/xxx` sans `https://`) sont supprimés
- Message d'avertissement automatique (disparaît après 5 secondes)
- Logs de toutes les suppressions

### 📚 Commande /help
Nouvelle commande pour afficher toutes les commandes disponibles.

#### Caractéristiques
- Réservée au rôle `1303464584816099339`
- Embed détaillé avec toutes les commandes
- Sections organisées (Tickets, Leaks, Vérification, etc.)
- Commandes copiables en blocs de code
- Informations sur le système de liens

### ⏱️ Auto-suppression des Salons de Vérification
Les salons de vérification sont maintenant supprimés automatiquement.

#### Fonctionnement
- **Timer de 30 secondes** après la création du salon
- **Avertissement dans l'embed** : "This channel will be deleted in 30 seconds if you don't verify."
- Si la vérification est complétée avant : le timer est **annulé** et le salon est supprimé immédiatement
- Si le timer expire : le salon est supprimé automatiquement
- Logs détaillés de chaque suppression

#### Avantages
- ✅ Évite l'accumulation de salons de vérification
- ✅ Nettoie automatiquement les salons non utilisés
- ✅ Timer annulé si vérification réussie (pas de double suppression)
- ✅ Message clair pour l'utilisateur
- ✅ Pas d'intervention manuelle nécessaire

### 🔄 Système de Vérification Amélioré
Le système de vérification a été entièrement revu pour plus de fiabilité.

#### Détection intelligente de l'ID
Le bot détecte maintenant l'ID utilisateur dans :
- Les mentions `<@123456789>`
- Le footer des embeds (`User ID: 123456789`)
- Les fields des embeds (champs contenant "ID")
- La description des embeds
- Le titre des embeds

#### Suppression par pseudo
- Le bot cherche le salon de vérification par le **pseudo de l'utilisateur**
- Format : `username-verify`
- Plus besoin de stocker l'association ID/Channel
- Fonctionne même si le salon n'est pas dans le cache

#### Nouveau rôle de vérification
- Rôle attribué : `1303466644269437039`
- Attribution automatique dès la vérification
- Suppression immédiate du salon après attribution

---

## Version 1.2.0 - Système de mise à jour amélioré

### 🎯 Mise à jour par champ
Quand vous cliquez sur "Mettre à jour" après un signalement, vous avez maintenant le choix de mettre à jour :
- **Nom** ✏️ - Change le nom du salon et le titre de l'embed
- **Description** 📝 - Change la description du leak
- **Lien Download** 📥 - Change le lien de téléchargement
- **Lien Preview** 👁️ - Change le lien de preview et l'image/miniature

### 📋 Workflow de mise à jour
1. Cliquez sur "Ne fonctionne plus" sur un leak
2. Message envoyé dans le salon de signalement avec boutons
3. Cliquez sur "Mettre à jour"
4. Choisissez ce que vous voulez mettre à jour
5. Envoyez la nouvelle valeur
6. Le leak est mis à jour automatiquement

### ✨ Fonctionnalités
- Mise à jour du nom change aussi le nom du salon
- Mise à jour du preview gère automatiquement YouTube ou images
- Bouton "Annuler" pour annuler la mise à jour
- Timeout de 2 minutes pour chaque mise à jour
- Messages de confirmation pour chaque action

---

## Version 1.1.0 - Mise à jour du système de leaks

### 🎨 Modifications des emojis
Les emojis des catégories de leaks ont été mis à jour :
- **Pack Graphique** : `「🌅」`
- **Base** : `「🏙️」`
- **Pack de Vêtements** : `「👚」`
- **Script** : `「🧰」`
- **Mapping** : `「🏡」`

### 📝 Noms des salons
- Les noms de salons n'ont plus d'espace entre l'emoji et le nom
- Format : `「emoji」nom-du-leak` (sans espace)

### 🔧 Système de gestion des leaks
- **Suppression de l'envoi automatique** : Le message de gestion n'est plus envoyé lors de la création d'un leak
- **Signalement amélioré** : Quand un utilisateur clique sur "Ne fonctionne plus", un message est envoyé dans le salon de signalement avec :
  - Informations sur le leak
  - Bouton **Supprimer** pour supprimer le salon
  - Bouton **Mettre à jour** pour modifier la description

### ✨ Nouvelles fonctionnalités

#### Suppression de leak
- Cliquez sur le bouton "Supprimer" dans le salon de signalement
- Le salon est supprimé immédiatement
- Confirmation envoyée en message éphémère

#### Mise à jour de leak
- Cliquez sur le bouton "Mettre à jour" dans le salon de signalement
- Le bot demande la nouvelle description
- Vous avez 2 minutes pour répondre
- La description du leak est mise à jour automatiquement
- Le footer indique qui a fait la mise à jour

### 🎯 Workflow complet

1. **Création** : `/leak` crée le salon avec l'embed et les boutons
2. **Signalement** : Un utilisateur clique sur "Ne fonctionne plus"
3. **Gestion** : Le message apparaît dans le salon de signalement avec les boutons
4. **Action** : Le staff peut supprimer ou mettre à jour le leak

### 📍 Configuration
- **Salon de signalement** : `1303484319498637333`
- **Rôle autorisé** : `1303464707784704153`

---

## Version 1.0.0 - Version initiale

### Fonctionnalités
- ✅ Système de vérification automatique
- ✅ Système de tickets (5 types)
- ✅ Système de leaks (5 catégories)
- ✅ Intégration complète en un seul bot
