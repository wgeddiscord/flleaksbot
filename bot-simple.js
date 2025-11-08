const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const config = require('./config.json');

// Créer le client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Fichier pour suivre les rôles déjà attribués
const PROCESSED_FILE = path.join(__dirname, 'processed_users.txt');

// S'assurer que le fichier existe
if (!fs.existsSync(PROCESSED_FILE)) {
    fs.writeFileSync(PROCESSED_FILE, '');
}

// Fonction pour vérifier si un utilisateur a déjà été traité
function isUserProcessed(userId) {
    const processed = fs.readFileSync(PROCESSED_FILE, 'utf8');
    return processed.includes(`id: ${userId}`);
}

// Fonction pour marquer un utilisateur comme traité
function markUserAsProcessed(userId) {
    fs.appendFileSync(PROCESSED_FILE, `id: ${userId}\n`);
}

// Fonction pour vérifier les nouvelles vérifications sur le site
async function checkForNewVerifications() {
    try {
        // Télécharger le fichier de vérifications depuis le site
        const response = await axios.get('https://discordverify.infinityfreeapp.com/verifications.txt');
        const verifications = response.data;

        // Parser les vérifications
        const lines = verifications.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('id:')) {
                const userId = line.replace('id:', '').trim();
                
                // Vérifier si déjà traité
                if (!isUserProcessed(userId)) {
                    console.log(`\n🆕 NOUVELLE VÉRIFICATION DÉTECTÉE!`);
                    console.log(`👤 User ID: ${userId}`);
                    console.log(`🎭 Rôle à attribuer: ${config.roleId}`);
                    console.log(`⏳ Attribution en cours...`);
                    
                    // Attribuer le rôle
                    const success = await assignRole(userId);
                    if (success) {
                        markUserAsProcessed(userId);
                        console.log(`✅ SUCCÈS: Rôle attribué à ${userId}\n`);
                    } else {
                        console.log(`❌ ÉCHEC: Impossible d'attribuer le rôle à ${userId}\n`);
                    }
                }
            }
        }
    } catch (error) {
        // Ignorer les erreurs (fichier peut ne pas exister encore)
        if (error.response && error.response.status !== 404) {
            console.error('❌ Erreur lors de la vérification:', error.message);
        }
    }
}

// Fonction pour attribuer le rôle
async function assignRole(userId) {
    try {
        console.log(`   🔎 Recherche sur ${client.guilds.cache.size} serveur(s)...`);
        
        // Parcourir tous les serveurs où le bot est présent
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                console.log(`   📡 Serveur: ${guild.name} (ID: ${guildId})`);
                const member = await guild.members.fetch(userId);
                
                if (member) {
                    console.log(`   ✓ Membre trouvé: ${member.user.tag}`);
                    
                    // Vérifier si le membre a déjà le rôle
                    if (member.roles.cache.has(config.roleId)) {
                        console.log(`   ⚠️ Le membre a déjà le rôle!`);
                        return true;
                    }
                    
                    // Vérifier les permissions du bot
                    const botMember = guild.members.cache.get(client.user.id);
                    if (!botMember.permissions.has('ManageRoles')) {
                        console.log(`   ❌ ERREUR: Le bot n'a pas la permission "Manage Roles"!`);
                        return false;
                    }
                    
                    // Vérifier la hiérarchie des rôles
                    const role = guild.roles.cache.get(config.roleId);
                    if (!role) {
                        console.log(`   ❌ ERREUR: Rôle ${config.roleId} introuvable sur ce serveur!`);
                        return false;
                    }
                    
                    if (botMember.roles.highest.position <= role.position) {
                        console.log(`   ❌ ERREUR: Le rôle du bot (position ${botMember.roles.highest.position}) est en dessous du rôle cible (position ${role.position})!`);
                        console.log(`   💡 Solution: Déplacez le rôle du bot AU-DESSUS du rôle "${role.name}" dans les paramètres du serveur!`);
                        return false;
                    }
                    
                    console.log(`   🎭 Attribution du rôle "${role.name}"...`);
                    await member.roles.add(config.roleId);
                    console.log(`   ✅ Rôle attribué avec succès!`);
                    return true;
                }
            } catch (err) {
                if (err.code === 10007) {
                    console.log(`   ⚠️ Membre introuvable sur ${guild.name}`);
                } else {
                    console.log(`   ❌ Erreur sur ${guild.name}: ${err.message}`);
                }
                continue;
            }
        }
        console.log(`   ❌ Utilisateur ${userId} introuvable sur tous les serveurs`);
    } catch (error) {
        console.error(`   ❌ ERREUR CRITIQUE:`, error);
    }
    return false;
}

// Événement quand le bot est prêt
client.once('ready', () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    console.log(`🔍 Vérification des nouvelles validations toutes les 10 secondes...`);
    
    // Vérifier toutes les 10 secondes
    setInterval(checkForNewVerifications, 10000);
});

// Commande de vérification
client.on('messageCreate', async (message) => {
    if (message.content === '!verify') {
        // Créer le bouton de vérification qui redirige vers le site
        const button = new ButtonBuilder()
            .setLabel('Se Vérifier')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discordverify.infinityfreeapp.com?userId=${message.author.id}&guildId=${message.guild.id}&username=${encodeURIComponent(message.author.username)}`);

        const row = new ActionRowBuilder().addComponents(button);

        const embed = new EmbedBuilder()
            .setTitle('🔐 Vérification Requise')
            .setDescription('Cliquez sur le bouton ci-dessous pour vous vérifier et accéder au serveur.')
            .setColor('#5865F2')
            .setFooter({ text: 'Système de Vérification' })
            .setTimestamp();

        await message.reply({
            embeds: [embed],
            components: [row]
        });
    }
});

// Connexion du bot
client.login(config.token);
