const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

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

// ID du salon à surveiller
const WEBHOOK_CHANNEL_ID = '1424036316189819050';

// Stocker les salons de vérification (userId -> channelId)
const verificationChannels = new Map();

// Fonction pour attribuer le rôle
async function assignRole(userId, guildId) {
    try {
        console.log(`\n🆕 NOUVELLE VÉRIFICATION DÉTECTÉE!`);
        console.log(`👤 User ID: ${userId}`);
        console.log(`🎭 Rôle à attribuer: ${config.roleId}`);
        console.log(`⏳ Attribution en cours...`);
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.log(`   ❌ Serveur ${guildId} introuvable`);
            return false;
        }
        
        console.log(`   📡 Serveur: ${guild.name}`);
        
        try {
            const member = await guild.members.fetch(userId);
            
            if (!member) {
                console.log(`   ❌ Membre ${userId} introuvable`);
                return false;
            }
            
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
            console.log(`✅ SUCCÈS: Rôle attribué à ${userId}\n`);
            return true;
            
        } catch (err) {
            console.log(`   ❌ Erreur: ${err.message}`);
            return false;
        }
        
    } catch (error) {
        console.error(`   ❌ ERREUR CRITIQUE:`, error);
        return false;
    }
}

// Fonction pour extraire l'ID utilisateur d'un message
function extractUserIdFromMessage(message) {
    // Chercher les mentions <@123456789>
    const mentionMatch = message.content.match(/<@!?(\d+)>/);
    if (mentionMatch) {
        return mentionMatch[1];
    }
    
    // Chercher dans les embeds
    if (message.embeds && message.embeds.length > 0) {
        for (const embed of message.embeds) {
            // Chercher dans les fields
            if (embed.fields) {
                for (const field of embed.fields) {
                    // Chercher le field "ID"
                    if (field.name.toLowerCase() === 'id') {
                        const idMatch = field.value.match(/\d{17,19}/);
                        if (idMatch) {
                            return idMatch[0];
                        }
                    }
                }
            }
            
            // Chercher dans la description
            if (embed.description) {
                const idMatch = embed.description.match(/<@!?(\d+)>/);
                if (idMatch) {
                    return idMatch[1];
                }
            }
        }
    }
    
    return null;
}

// Événement quand un membre rejoint le serveur
client.on('guildMemberAdd', async (member) => {
    try {
        console.log(`\n👋 Nouveau membre: ${member.user.tag} (${member.id})`);

        // Créer un salon privé pour la vérification
        const channelName = `${member.user.username}-verify`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        
        console.log(`   📝 Création du salon: ${channelName}`);

        const verifyChannel = await member.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: member.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: member.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                },
                {
                    id: client.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels]
                }
            ]
        });

        console.log(`   ✅ Salon créé: ${verifyChannel.name} (${verifyChannel.id})`);

        // Stocker l'association
        verificationChannels.set(member.id, verifyChannel.id);

        // Créer le bouton de vérification avec les infos du membre
        const button = new ButtonBuilder()
            .setLabel('Verify Now')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discordverify.infinityfreeapp.com?userId=${member.id}&guildId=${member.guild.id}&username=${encodeURIComponent(member.user.username)}`);

        const row = new ActionRowBuilder().addComponents(button);

        const embed = new EmbedBuilder()
            .setTitle('🔐 Verification Required')
            .setDescription(`Welcome **${member.user.username}**!\n\nTo access the server, you need to verify yourself.\n\nClick the button below to complete the verification.`)
            .setColor('#3b82f6')
            .setFooter({ text: `User ID: ${member.id} • Verification System` })
            .setTimestamp();

        await verifyChannel.send({
            content: `<@${member.id}> 👋`,
            embeds: [embed],
            components: [row]
        });

        console.log(`   📨 Message de vérification envoyé`);

    } catch (error) {
        console.error(`   ❌ Erreur lors de la création du salon:`, error);
    }
});

// Événement quand le bot est prêt
client.once('ready', () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    console.log(`👀 Surveillance du salon webhook: ${WEBHOOK_CHANNEL_ID}`);
    console.log(`🚪 Création automatique de salons de vérification pour les nouveaux membres\n`);
});

// Événement pour détecter les nouveaux messages
client.on('messageCreate', async (message) => {
    // Ignorer si ce n'est pas le bon salon
    if (message.channelId !== WEBHOOK_CHANNEL_ID) {
        return;
    }

    // Ignorer si ce n'est pas un webhook ou un bot
    if (!message.webhookId && !message.author.bot) {
        return;
    }

    console.log(`\n📨 Nouveau message webhook détecté!`);
    console.log(`   ⏰ Date: ${message.createdAt.toLocaleString()}`);
    console.log(`   📝 Contenu: ${message.content.substring(0, 50)}...`);

    // Extraire l'ID utilisateur
    const userId = extractUserIdFromMessage(message);

    if (userId) {
        console.log(`   🔍 ID extrait: ${userId}`);
        
        // Attribuer le rôle
        const success = await assignRole(userId, message.guildId);
        
        // Si le rôle a été attribué avec succès, supprimer le salon de vérification
        if (success && verificationChannels.has(userId)) {
            const channelId = verificationChannels.get(userId);
            try {
                const channel = await client.channels.fetch(channelId);
                if (channel) {
                    console.log(`\n🗑️ Suppression du salon de vérification: ${channel.name}`);
                    await channel.delete('Vérification terminée');
                    verificationChannels.delete(userId);
                    console.log(`   ✅ Salon supprimé avec succès`);
                }
            } catch (error) {
                console.log(`   ⚠️ Impossible de supprimer le salon:`, error.message);
            }
        }
    } else {
        console.log(`   ⚠️ Aucun ID utilisateur trouvé dans ce message`);
    }
});

// Commande pour créer le message de vérification permanent
client.on('messageCreate', async (message) => {
    // Commande !setup-verify (seulement pour les admins)
    if (message.content === '!setup-verify_admin_rooooot') {
        // Vérifier si l'utilisateur a les permissions
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Vous devez être administrateur pour utiliser cette commande.');
        }

        const button = new ButtonBuilder()
            .setLabel('🔐 Se Vérifier')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discordverify.infinityfreeapp.com');

        const row = new ActionRowBuilder().addComponents(button);

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Vérification Discord')
            .setDescription('**Bienvenue sur le serveur!**\n\nPour accéder au serveur, vous devez vous vérifier.\n\n**Comment ça marche?**\n1️⃣ Cliquez sur le bouton ci-dessous\n2️⃣ Connectez-vous avec Discord\n3️⃣ Cliquez sur "Vérifier Maintenant"\n4️⃣ Recevez votre rôle automatiquement!\n\n✅ **C\'est rapide et sécurisé**')
            .setColor('#5865F2')
            .setFooter({ text: 'Système de Vérification' })
            .setTimestamp();

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        // Supprimer la commande
        await message.delete().catch(() => {});
    }
});

// Connexion du bot
client.login(config.token);
