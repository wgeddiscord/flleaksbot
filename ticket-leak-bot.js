const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType, PermissionFlagsBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

// Configuration: Priorité aux variables d'environnement, sinon config.json
let config;
try {
    // Essayer de charger config.json s'il existe
    if (fs.existsSync('./config.json')) {
        config = require('./config.json');
    } else {
        config = {};
    }
} catch (error) {
    console.log('⚠️ config.json non trouvé ou invalide, utilisation des variables d\'environnement');
    config = {};
}

// Utiliser les variables d'environnement en priorité
config = {
    token: process.env.DISCORD_TOKEN || config.token,
    roleId: process.env.ROLE_ID || config.roleId,
    webhook: process.env.WEBHOOK_URL || config.webhook
};

// Vérifier que les valeurs essentielles sont présentes
if (!config.token) {
    console.error('❌ ERREUR: DISCORD_TOKEN manquant! Définissez-le dans les variables d\'environnement Railway.');
    process.exit(1);
}
if (!config.roleId) {
    console.error('❌ ERREUR: ROLE_ID manquant! Définissez-le dans les variables d\'environnement Railway.');
    process.exit(1);
}

// Créer le client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const startTime = Date.now();

// ============================================
// CONFIGURATION SYSTÈME DE VÉRIFICATION
// ============================================
const WEBHOOK_CHANNEL_ID = '1424036316189819050';
const VERIFICATION_ROLE_ID = '1303466644269437039';
const verificationChannels = new Map();
const verificationTimers = new Map(); // Stocker les timers pour pouvoir les annuler

// ============================================
// CONFIGURATION SYSTÈME DE TICKETS
// ============================================
const TICKET_CATEGORIES = {
    "question": "1303486246730862613",
    "paiement": "1303486415522369577",
    "recrutement": "1303486530681180263",
    "staff": "1303486633399812137",
    "membre": "1303486706191699998"
};

// ============================================
// CONFIGURATION SYSTÈME DE LEAKS
// ============================================
const LEAK_CATEGORIES = {
    "pack_graphique": "1322302187178692659",
    "base": "1304890672913973319",
    "pack_vetements": "1312422941488713729",
    "script": "1349813348136521810",
    "mapping": "1317463085434277999"
};

// Emojis pour chaque type de leak
const LEAK_EMOJIS = {
    "pack_graphique": "「🌅」",
    "base": "「🏙️」",
    "pack_vetements": "「👚」",
    "script": "「🧰」",
    "mapping": "「🏡」"
};

// ID du rôle autorisé à utiliser /leak
const LEAK_ROLE_ID = "1303464707784704153";

// ID du salon pour les signalements
const REPORT_CHANNEL_ID = "1303484319498637333";

// ID du rôle autorisé à envoyer des liens
const LINK_ALLOWED_ROLE_ID = "1303464707784704153";

// ID du rôle autorisé à utiliser /help
const HELP_ROLE_ID = "1303464584816099339";

// Embeds personnalisés pour chaque type de ticket
const TICKET_EMBEDS = {
    "question": {
        title: "❓ Ticket Question",
        description: "Ce ticket est destiné à poser une question.",
        color: 0x3b82f6
    },
    "paiement": {
        title: "💳 Ticket Paiement & Boutique",
        description: "Ce ticket est destiné à un paiement du VIP ou un paiement dans la boutique.",
        color: 0x10b981
    },
    "recrutement": {
        title: "🎓 Ticket Recrutement",
        description: "Ce ticket est destiné à déposer une candidature.",
        color: 0x8b5cf6
    },
    "staff": {
        title: "🛑 Ticket Signalement Staff",
        description: "Ce ticket est destiné à signaler un membre du staff.",
        color: 0xef4444
    },
    "membre": {
        title: "🛑 Ticket Signalement Membre",
        description: "Ce ticket est destiné à signaler un membre.",
        color: 0xf97316
    }
};

// Fonction pour extraire l'ID de la vidéo YouTube
function extractYouTubeId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Fonction pour vérifier si c'est un lien YouTube
function isYouTubeUrl(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

// Fonction pour extraire l'ID utilisateur d'un message webhook
function extractUserIdFromMessage(message) {
    // Chercher les mentions <@123456789>
    const mentionMatch = message.content.match(/<@!?(\d+)>/);
    if (mentionMatch) {
        return mentionMatch[1];
    }
    
    // Chercher dans les embeds
    if (message.embeds && message.embeds.length > 0) {
        for (const embed of message.embeds) {
            // Chercher dans le footer (format: "User ID: 123456789")
            if (embed.footer && embed.footer.text) {
                const footerMatch = embed.footer.text.match(/User ID:\s*(\d{17,19})/i);
                if (footerMatch) {
                    return footerMatch[1];
                }
                // Chercher un ID simple dans le footer
                const footerIdMatch = embed.footer.text.match(/\d{17,19}/);
                if (footerIdMatch) {
                    return footerIdMatch[0];
                }
            }
            
            // Chercher dans les fields
            if (embed.fields) {
                for (const field of embed.fields) {
                    // Chercher le field "ID" ou "User ID"
                    if (field.name.toLowerCase().includes('id')) {
                        const idMatch = field.value.match(/\d{17,19}/);
                        if (idMatch) {
                            return idMatch[0];
                        }
                    }
                }
            }
            
            // Chercher dans la description
            if (embed.description) {
                // Chercher les mentions
                const descMentionMatch = embed.description.match(/<@!?(\d+)>/);
                if (descMentionMatch) {
                    return descMentionMatch[1];
                }
                // Chercher "User ID: 123456789"
                const descIdMatch = embed.description.match(/User ID:\s*(\d{17,19})/i);
                if (descIdMatch) {
                    return descIdMatch[1];
                }
                // Chercher un ID simple
                const descSimpleMatch = embed.description.match(/\d{17,19}/);
                if (descSimpleMatch) {
                    return descSimpleMatch[0];
                }
            }
            
            // Chercher dans le title
            if (embed.title) {
                const titleMatch = embed.title.match(/\d{17,19}/);
                if (titleMatch) {
                    return titleMatch[0];
                }
            }
        }
    }
    
    return null;
}

// Fonction pour détecter les liens dans un message
function containsLink(text) {
    // Regex pour détecter les liens (http, https, www, discord.gg, etc.)
    const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(discord\.gg\/[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|gg|io|fr|be|ca|uk|de)[^\s]*)/gi;
    return linkRegex.test(text);
}

// Fonction pour vérifier si un lien est YouTube
function isYouTubeLinkOnly(text) {
    const youtubeRegex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/gi;
    return youtubeRegex.test(text);
}

// Fonction pour vérifier si c'est un lien Discord mal formé
function isMalformedDiscordLink(text) {
    // Détecte discord.gg sans https://
    return /discord\.gg\/[^\s]+/i.test(text) && !/https?:\/\/discord\.gg/i.test(text);
}

// Fonction pour vérifier si le message est dans un salon de ticket
function isInTicketChannel(channel) {
    // Vérifier si le salon est dans une des catégories de tickets
    if (!channel.parent) return false;
    return Object.values(TICKET_CATEGORIES).includes(channel.parentId);
}

// ============================================
// SYSTÈME DE VÉRIFICATION
// ============================================

// Fonction pour attribuer le rôle
async function assignRole(userId, guildId) {
    try {
        console.log(`\n🆕 NOUVELLE VÉRIFICATION DÉTECTÉE!`);
        console.log(`👤 User ID: ${userId}`);
        console.log(`🎭 Rôle à attribuer: ${VERIFICATION_ROLE_ID}`);
        console.log(`⌛ Attribution en cours...`);
        
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
            if (member.roles.cache.has(VERIFICATION_ROLE_ID)) {
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
            const role = guild.roles.cache.get(VERIFICATION_ROLE_ID);
            if (!role) {
                console.log(`   ❌ ERREUR: Rôle ${VERIFICATION_ROLE_ID} introuvable sur ce serveur!`);
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
            .setDescription(`Welcome **${member.user.username}**!\n\nTo access the server, you need to verify yourself.\n\n**How it works:**\n1️⃣ Click the button below\n2️⃣ Connect with Discord\n3️⃣ Click "Verify Now"\n4️⃣ Get your role automatically!\n\n⚠️ **This channel will be deleted in 30 seconds if you don't verify.**`)
            .setColor('#3b82f6')
            .setFooter({ text: `User ID: ${member.id} • Verification System` })
            .setTimestamp();

        await verifyChannel.send({
            content: `<@${member.id}> 👋`,
            embeds: [embed],
            components: [row]
        });

        console.log(`   📨 Message de vérification envoyé`);

        // Supprimer le salon après 30 secondes si la vérification n'est pas complétée
        const timer = setTimeout(async () => {
            try {
                // Vérifier si le salon existe toujours (pas supprimé par vérification réussie)
                if (verificationChannels.has(member.id)) {
                    const channelId = verificationChannels.get(member.id);
                    const channel = await member.guild.channels.fetch(channelId).catch(() => null);
                    
                    if (channel) {
                        console.log(`\n⏱️ Timeout de vérification pour ${member.user.tag}`);
                        console.log(`   🗑️ Suppression du salon: ${channel.name}`);
                        await channel.delete('Timeout de vérification (30 secondes)');
                        verificationChannels.delete(member.id);
                        verificationTimers.delete(member.id);
                        console.log(`   ✅ Salon supprimé automatiquement`);
                    }
                }
            } catch (error) {
                console.error(`   ❌ Erreur lors de la suppression automatique:`, error);
            }
        }, 30000); // 30 secondes
        
        // Stocker le timer pour pouvoir l'annuler si la vérification réussit
        verificationTimers.set(member.id, timer);
        console.log(`   ⏱️ Timer de 30 secondes démarré`);

    } catch (error) {
        console.error(`   ❌ Erreur lors de la création du salon:`, error);
    }
});

// ============================================
// ÉVÉNEMENT BOT PRÊT
// ============================================
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} est en ligne !`);
    console.log(`👀 Surveillance du salon webhook: ${WEBHOOK_CHANNEL_ID}`);
    console.log(`🚪 Création automatique de salons de vérification pour les nouveaux membres`);
    
    // Enregistrer les commandes slash
    const commands = [
        new SlashCommandBuilder()
            .setName('leak')
            .setDescription('Créer un nouveau leak')
            .addStringOption(option =>
                option.setName('nom')
                    .setDescription('Nom du leak')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('Description du leak')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('type')
                    .setDescription('Type de leak')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Pack Graphique', value: 'pack_graphique' },
                        { name: 'Base', value: 'base' },
                        { name: 'Pack de Vêtements', value: 'pack_vetements' },
                        { name: 'Script', value: 'script' },
                        { name: 'Mapping', value: 'mapping' }
                    ))
            .addStringOption(option =>
                option.setName('lien')
                    .setDescription('Lien de téléchargement')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('preview')
                    .setDescription('Lien de preview (image ou vidéo YouTube)')
                    .setRequired(true)),
        new SlashCommandBuilder()
            .setName('help')
            .setDescription('Afficher toutes les commandes disponibles du bot')
    ];

    const rest = new REST({ version: '10' }).setToken(config.token);

    try {
        console.log('🔄 Enregistrement des commandes slash...');
        
        // Récupérer tous les serveurs
        for (const guild of client.guilds.cache.values()) {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guild.id),
                { body: commands }
            );
            console.log(`✅ Commandes enregistrées pour ${guild.name}`);
        }
        
        console.log('✅ Commandes slash enregistrées avec succès !');
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement des commandes:', error);
    }

    // Changer le statut
    client.user.setActivity('Tickets 🧾', { type: 0 });
    console.log('\n🚀 Bot prêt et opérationnel!\n');
});

// ============================================
// GESTION DES MESSAGES
// ============================================
client.on('messageCreate', async (message) => {
    // Log de tous les messages pour déboguer
    console.log(`\n💬 Message reçu dans ${message.channel.name} (${message.channelId})`);
    console.log(`   👤 Auteur: ${message.author.tag} (Bot: ${message.author.bot})`);
    console.log(`   📝 Contenu: ${message.content.substring(0, 100) || '[Embed uniquement]'}`);
    
    // Ignorer les messages du bot SAUF dans le salon de vérification
    if (message.author.bot && message.channelId !== WEBHOOK_CHANNEL_ID) {
        console.log(`   ⏭️ Message ignoré (bot dans un autre salon)`);
        return;
    }

    // ===== SYSTÈME DE MODÉRATION DES LIENS =====
    // Vérifier si le message contient des liens
    if (containsLink(message.content)) {
        // Vérifier si c'est dans un salon de ticket (les liens sont autorisés)
        if (isInTicketChannel(message.channel)) {
            // Les liens sont autorisés dans les tickets, ne rien faire
        } else {
            // Vérifier si l'utilisateur a le rôle autorisé
            const hasAllowedRole = message.member && message.member.roles.cache.has(LINK_ALLOWED_ROLE_ID);
            
            if (!hasAllowedRole) {
                // Vérifier si c'est un lien YouTube (autorisé)
                if (isYouTubeLinkOnly(message.content)) {
                    // Les liens YouTube sont autorisés pour tout le monde
                } else if (isMalformedDiscordLink(message.content)) {
                    // Lien Discord mal formé (sans https://)
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`❌ ${message.author}, les liens Discord doivent commencer par \`https://\``);
                        setTimeout(() => warning.delete().catch(() => {}), 5000);
                        console.log(`Lien Discord mal formé supprimé de ${message.author.tag}`);
                    } catch (error) {
                        console.error('Erreur lors de la suppression du message:', error);
                    }
                    return;
                } else {
                    // Autre type de lien non autorisé
                    try {
                        await message.delete();
                        const warning = await message.channel.send(`❌ ${message.author}, vous n'avez pas la permission d'envoyer des liens ici. Seuls les liens YouTube sont autorisés.`);
                        setTimeout(() => warning.delete().catch(() => {}), 5000);
                        console.log(`Lien non autorisé supprimé de ${message.author.tag}`);
                    } catch (error) {
                        console.error('Erreur lors de la suppression du message:', error);
                    }
                    return;
                }
            }
        }
    }

    // ===== SYSTÈME DE VÉRIFICATION =====
    // Détecter les messages dans le salon de vérification
    if (message.channelId === WEBHOOK_CHANNEL_ID) {
        console.log(`\n🔍 Message dans le salon de vérification détecté!`);
        console.log(`   🆔 Salon ID: ${message.channelId} (attendu: ${WEBHOOK_CHANNEL_ID})`);
        console.log(`   🤖 Webhook: ${message.webhookId ? 'Oui' : 'Non'}`);
        console.log(`   🤖 Bot: ${message.author.bot ? 'Oui' : 'Non'}`);
        
        // Accepter uniquement les webhooks ou les bots (pas les messages utilisateurs normaux)
        if (!message.webhookId && !message.author.bot) {
            console.log(`   ⚠️ Message ignoré: ni webhook ni bot`);
            return;
        }

        console.log(`\n✅ Message de vérification accepté!`);
        console.log(`   ⏰ Date: ${message.createdAt.toLocaleString()}`);
        console.log(`   📝 Contenu: ${message.content.substring(0, 50)}...`);
        console.log(`   🤖 Webhook ID: ${message.webhookId || 'N/A'}`);
        console.log(`   👤 Author: ${message.author.tag}`);

        // Afficher les embeds pour déboguer
        if (message.embeds && message.embeds.length > 0) {
            console.log(`   📋 Nombre d'embeds: ${message.embeds.length}`);
            message.embeds.forEach((embed, index) => {
                console.log(`   📋 Embed ${index + 1}:`);
                if (embed.title) console.log(`      - Title: ${embed.title}`);
                if (embed.description) console.log(`      - Description: ${embed.description.substring(0, 100)}`);
                if (embed.fields) {
                    console.log(`      - Fields: ${embed.fields.length}`);
                    embed.fields.forEach(field => {
                        console.log(`        • ${field.name}: ${field.value}`);
                    });
                }
                if (embed.footer) console.log(`      - Footer: ${embed.footer.text}`);
            });
        }

        // Extraire l'ID utilisateur (d'abord dans le contenu, puis dans l'embed)
        let userId = null;
        
        // Chercher d'abord dans le contenu du message (mention au-dessus de l'embed)
        if (message.content) {
            const mentionMatch = message.content.match(/<@!?(\d+)>/);
            if (mentionMatch) {
                userId = mentionMatch[1];
                console.log(`   🔍 ID trouvé dans la mention: ${userId}`);
            }
        }
        
        // Si pas trouvé, chercher dans l'embed
        if (!userId) {
            userId = extractUserIdFromMessage(message);
            if (userId) {
                console.log(`   🔍 ID trouvé dans l'embed: ${userId}`);
            }
        }

        if (userId) {
            console.log(`   ✅ ID final utilisé: ${userId}`);
            
            // Attribuer le rôle
            const success = await assignRole(userId, message.guildId);
            
            // Si le rôle a été attribué avec succès, supprimer le salon de vérification
            if (success) {
                try {
                    const guild = client.guilds.cache.get(message.guildId);
                    const member = await guild.members.fetch(userId);
                    
                    if (member) {
                        // Chercher le salon de vérification par le pseudo de l'utilisateur
                        const channelName = `${member.user.username}-verify`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                        console.log(`   🔍 Recherche du salon: ${channelName}`);
                        
                        const verifyChannel = guild.channels.cache.find(ch => 
                            ch.name === channelName && ch.type === ChannelType.GuildText
                        );
                        
                        if (verifyChannel) {
                            // Annuler le timer de suppression automatique
                            if (verificationTimers.has(userId)) {
                                clearTimeout(verificationTimers.get(userId));
                                verificationTimers.delete(userId);
                                console.log(`   ⏱️ Timer de suppression annulé`);
                            }
                            
                            console.log(`\n🗑️ Suppression du salon de vérification: ${verifyChannel.name}`);
                            await verifyChannel.delete('Vérification terminée');
                            verificationChannels.delete(userId);
                            console.log(`   ✅ Salon supprimé avec succès`);
                        } else {
                            console.log(`   ⚠️ Salon de vérification introuvable pour ${member.user.tag}`);
                        }
                    }
                } catch (error) {
                    console.log(`   ⚠️ Erreur lors de la suppression du salon:`, error.message);
                }
            }
        } else {
            console.log(`   ⚠️ Aucun ID utilisateur trouvé dans ce message`);
        }
        return;
    }

    // ===== COMMANDE SETUP VÉRIFICATION =====
    if (message.content === '!setup-verify_admin_rooooot') {
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

        await message.delete().catch(() => {});
        return;
    }

    // ===== COMMANDE TICKETS =====
    if (message.content === '+send_ticket_message' && message.member.permissions.has('Administrator')) {
        const guildIconUrl = message.guild.iconURL();

        const embed = new EmbedBuilder()
            .setTitle('Ticket')
            .setDescription(
                'Envie de rentrer en contact avec le staff ? Vous pouvez créer un ticket ' +
                'pour nous contacter. Nous répondons à toutes vos questions, sauf celles ' +
                'du développement, tous les jours.\n\n' +
                'Choisissez une catégorie ci-dessous pour ouvrir un ticket.'
            )
            .setColor(0x10b981)
            .setFooter({ text: 'FL-Leak © 2024', iconURL: guildIconUrl })
            .setTimestamp();

        if (guildIconUrl) {
            embed.setThumbnail(guildIconUrl);
        }

        // Créer les boutons
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_question')
                    .setLabel('❓ Question')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ticket_paiement')
                    .setLabel('💳 Paiement & Boutique')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ticket_recrutement')
                    .setLabel('📋 Candidature & Recrutement')
                    .setStyle(ButtonStyle.Primary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_staff')
                    .setLabel('⚠️ Signalement Staff')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('ticket_membre')
                    .setLabel('🚨 Signalement membre')
                    .setStyle(ButtonStyle.Danger)
            );

        await message.channel.send({ embeds: [embed], components: [row1, row2] });
        await message.delete().catch(() => {});
        
        console.log(`Message de tickets envoyé par ${message.author.tag} dans ${message.channel.name}`);
    }
});

// Gestion des interactions
client.on('interactionCreate', async (interaction) => {
    // Gestion des commandes slash
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'leak') {
            await handleLeakCommand(interaction);
        } else if (interaction.commandName === 'help') {
            await handleHelpCommand(interaction);
        }
    }
    
    // Gestion des boutons
    if (interaction.isButton()) {
        const customId = interaction.customId;

        if (customId.startsWith('ticket_')) {
            await handleTicketCreation(interaction, customId);
        } else if (customId === 'close_ticket') {
            await handleTicketClose(interaction);
        } else if (customId === 'close_ticket_yes') {
            await handleTicketCloseConfirmation(interaction, true);
        } else if (customId === 'close_ticket_no') {
            await handleTicketCloseConfirmation(interaction, false);
        } else if (customId.startsWith('leak_download_')) {
            // Le bouton de download est un lien, pas besoin de gérer
        } else if (customId.startsWith('leak_preview_')) {
            // Le bouton de preview est un lien, pas besoin de gérer
        } else if (customId.startsWith('leak_report_')) {
            await handleLeakReport(interaction);
        } else if (customId.startsWith('leak_delete_')) {
            await handleLeakDelete(interaction);
        } else if (customId.startsWith('leak_update_nom_')) {
            await handleLeakUpdateField(interaction, 'nom');
        } else if (customId.startsWith('leak_update_description_')) {
            await handleLeakUpdateField(interaction, 'description');
        } else if (customId.startsWith('leak_update_download_')) {
            await handleLeakUpdateField(interaction, 'download');
        } else if (customId.startsWith('leak_update_preview_')) {
            await handleLeakUpdateField(interaction, 'preview');
        } else if (customId.startsWith('leak_update_cancel_')) {
            await interaction.update({
                content: '❌ Mise à jour annulée.',
                embeds: [],
                components: []
            });
        } else if (customId.startsWith('leak_update_') && !customId.includes('_nom_') && !customId.includes('_description_') && !customId.includes('_download_') && !customId.includes('_preview_') && !customId.includes('_cancel_')) {
            await handleLeakUpdate(interaction);
        }
    }
});

// ============================================
// FONCTIONS DES COMMANDES SLASH
// ============================================

// Fonction pour gérer la commande /help
async function handleHelpCommand(interaction) {
    // Vérifier si l'utilisateur a le rôle requis
    if (!interaction.member.roles.cache.has(HELP_ROLE_ID)) {
        return await interaction.reply({
            content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle('📚 Commandes du Bot FL-Leak')
        .setDescription('Voici toutes les commandes disponibles pour gérer le serveur.')
        .setColor(0x5865F2)
        .setThumbnail(interaction.guild.iconURL())
        .addFields(
            {
                name: '🎫 Commandes Tickets',
                value: '```+send_ticket_message```\nEnvoie le message avec les boutons pour créer des tickets.\n*Réservé aux administrateurs*',
                inline: false
            },
            {
                name: '📦 Commandes Leaks',
                value: '```/leak nom:[nom] description:[desc] type:[type] lien:[url] preview:[url]```\nCrée un nouveau leak dans la catégorie appropriée.\n\n**Types disponibles:**\n• Pack Graphique\n• Base\n• Pack de Vêtements\n• Script\n• Mapping\n\n*Réservé au rôle Staff*',
                inline: false
            },
            {
                name: '🔐 Commandes Vérification',
                value: '```!setup-verify_admin_rooooot```\nCrée un message permanent de vérification pour les nouveaux membres.\n*Réservé aux administrateurs*',
                inline: false
            },
            {
                name: '❓ Commande Aide',
                value: '```/help```\nAffiche ce message d\'aide avec toutes les commandes disponibles.',
                inline: false
            },
            {
                name: '🔗 Système de Liens',
                value: '• Les liens YouTube sont autorisés pour tout le monde\n• Les autres liens nécessitent le rôle Staff\n• Les liens sont toujours autorisés dans les tickets\n• Les liens Discord doivent commencer par `https://`',
                inline: false
            },
            {
                name: '⚙️ Gestion des Leaks',
                value: '**Signalement:**\nCliquez sur "Ne fonctionne plus" sur un leak\n\n**Actions disponibles:**\n• 🗑️ Supprimer - Supprime le salon du leak\n• ✏️ Mettre à jour - Modifie le nom, description, lien download ou preview',
                inline: false
            }
        )
        .setFooter({ text: 'FL-Leak © 2024 • Bot de gestion', iconURL: interaction.guild.iconURL() })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    console.log(`Commande /help utilisée par ${interaction.user.tag}`);
}

// Fonction pour gérer la commande /leak
async function handleLeakCommand(interaction) {
    // Vérifier si l'utilisateur a le rôle requis
    if (!interaction.member.roles.cache.has(LEAK_ROLE_ID)) {
        return await interaction.reply({
            content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.',
            ephemeral: true
        });
    }

    const nom = interaction.options.getString('nom');
    const description = interaction.options.getString('description');
    const type = interaction.options.getString('type');
    const lien = interaction.options.getString('lien');
    const preview = interaction.options.getString('preview');

    // Récupérer la catégorie correspondante
    const categoryId = LEAK_CATEGORIES[type];
    const category = interaction.guild.channels.cache.get(categoryId);

    if (!category) {
        return await interaction.reply({
            content: '❌ Catégorie introuvable.',
            ephemeral: true
        });
    }

    try {
        // Créer le salon
        const emoji = LEAK_EMOJIS[type];
        const channelName = `${emoji}${nom.toLowerCase().replace(/\s+/g, '-')}`;

        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: categoryId,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages]
                }
            ]
        });

        // Créer l'embed
        const embed = new EmbedBuilder()
            .setTitle(`${emoji} ${nom}`)
            .setDescription(description)
            .setColor(0x5865F2)
            .setFooter({ text: `Créé par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        // Gérer le preview
        if (isYouTubeUrl(preview)) {
            const videoId = extractYouTubeId(preview);
            if (videoId) {
                embed.setImage(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
                embed.addFields({ name: '🔗 Preview :', value: `[Voir la vidéo](${preview})`, inline: false });
            }
        } else {
            // C'est une image
            embed.setImage(preview);
            embed.addFields({ name: '🔗 Preview :', value: `[Voir l'image](${preview})`, inline: false });
        }

        // Créer les boutons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Download')
                    .setEmoji('📥')
                    .setStyle(ButtonStyle.Link)
                    .setURL(lien),
                new ButtonBuilder()
                    .setLabel('Preview')
                    .setEmoji('👁️')
                    .setStyle(ButtonStyle.Link)
                    .setURL(preview),
                new ButtonBuilder()
                    .setCustomId(`leak_report_${channel.id}`)
                    .setLabel('Ne fonctionne plus')
                    .setEmoji('⚠️')
                    .setStyle(ButtonStyle.Danger)
            );

        // Envoyer le message dans le salon
        await channel.send({ embeds: [embed], components: [row] });

        await interaction.reply({
            content: `✅ Leak créé avec succès : ${channel}`,
            ephemeral: true
        });

        console.log(`Leak créé par ${interaction.user.tag}: ${nom} dans ${channel.name}`);

    } catch (error) {
        console.error('Erreur lors de la création du leak:', error);
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de la création du leak.',
            ephemeral: true
        });
    }
}

// Fonction pour gérer le signalement d'un leak
async function handleLeakReport(interaction) {
    const channelId = interaction.customId.split('_')[2];
    const channel = interaction.guild.channels.cache.get(channelId);

    if (!channel) {
        return await interaction.reply({
            content: '❌ Salon introuvable.',
            ephemeral: true
        });
    }

    // Envoyer un message dans le salon de signalement avec les boutons de gestion
    const reportChannel = interaction.guild.channels.cache.get(REPORT_CHANNEL_ID);
    if (reportChannel) {
        const embed = new EmbedBuilder()
            .setTitle('⚠️ Signalement de Leak')
            .setDescription(`**Salon:** ${channel}\n**Nom:** ${channel.name}\n**Signalé par:** ${interaction.user}`)
            .setColor(0xf97316)
            .setTimestamp();

        const manageRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`leak_delete_${channel.id}`)
                    .setLabel('Supprimer')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`leak_update_${channel.id}`)
                    .setLabel('Mettre à jour')
                    .setEmoji('✏️')
                    .setStyle(ButtonStyle.Primary)
            );

        await reportChannel.send({ embeds: [embed], components: [manageRow] });
    }

    await interaction.reply({
        content: '✅ Le leak a été signalé comme ne fonctionnant plus.',
        ephemeral: true
    });

    console.log(`Leak signalé par ${interaction.user.tag}: ${channel.name}`);
}

// Fonction pour gérer la suppression d'un leak
async function handleLeakDelete(interaction) {
    const channelId = interaction.customId.split('_')[2];
    const channel = interaction.guild.channels.cache.get(channelId);

    if (!channel) {
        return await interaction.reply({
            content: '❌ Salon introuvable.',
            ephemeral: true
        });
    }

    try {
        const channelName = channel.name;
        await channel.delete('Leak supprimé par un administrateur');
        
        await interaction.reply({
            content: `✅ Le salon **${channelName}** a été supprimé avec succès.`,
            ephemeral: true
        });

        console.log(`Leak supprimé par ${interaction.user.tag}: ${channelName}`);
    } catch (error) {
        console.error('Erreur lors de la suppression du leak:', error);
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de la suppression du salon.',
            ephemeral: true
        });
    }
}

// Fonction pour gérer la mise à jour d'un leak
async function handleLeakUpdate(interaction) {
    const channelId = interaction.customId.split('_')[2];
    const channel = interaction.guild.channels.cache.get(channelId);

    if (!channel) {
        return await interaction.reply({
            content: '❌ Salon introuvable.',
            ephemeral: true
        });
    }

    // Afficher les options de mise à jour
    const embed = new EmbedBuilder()
        .setTitle('📝 Mise à jour du leak')
        .setDescription(`**Salon:** ${channel}\n\nQue souhaitez-vous mettre à jour ?`)
        .setColor(0x3b82f6);

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`leak_update_nom_${channelId}`)
                .setLabel('Nom')
                .setEmoji('✏️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`leak_update_description_${channelId}`)
                .setLabel('Description')
                .setEmoji('📝')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`leak_update_download_${channelId}`)
                .setLabel('Lien Download')
                .setEmoji('📥')
                .setStyle(ButtonStyle.Primary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`leak_update_preview_${channelId}`)
                .setLabel('Lien Preview')
                .setEmoji('👁️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`leak_update_cancel_${channelId}`)
                .setLabel('Annuler')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger)
        );

    await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
}

// Fonction pour gérer la mise à jour d'un champ spécifique
async function handleLeakUpdateField(interaction, field) {
    const channelId = interaction.customId.split('_')[3];
    const channel = interaction.guild.channels.cache.get(channelId);

    if (!channel) {
        return await interaction.update({
            content: '❌ Salon introuvable.',
            embeds: [],
            components: []
        });
    }

    // Messages personnalisés selon le champ
    const fieldMessages = {
        'nom': '✏️ **Mise à jour du nom**\n\nVeuillez envoyer le nouveau nom du leak.',
        'description': '📝 **Mise à jour de la description**\n\nVeuillez envoyer la nouvelle description du leak.',
        'download': '📥 **Mise à jour du lien de téléchargement**\n\nVeuillez envoyer le nouveau lien de téléchargement.',
        'preview': '👁️ **Mise à jour du lien de preview**\n\nVeuillez envoyer le nouveau lien de preview (image ou YouTube).'
    };

    await interaction.update({
        content: `${fieldMessages[field]}\n\n*Vous avez 2 minutes pour répondre.*`,
        embeds: [],
        components: []
    });

    // Créer un collecteur de messages
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 120000 });

    collector.on('collect', async (message) => {
        const newValue = message.content;

        try {
            // Récupérer le message du leak dans le salon
            const messages = await channel.messages.fetch({ limit: 10 });
            const leakMessage = messages.find(msg => msg.author.id === client.user.id && msg.embeds.length > 0);

            if (!leakMessage) {
                await interaction.followUp({
                    content: '❌ Impossible de trouver le message du leak.',
                    ephemeral: true
                });
                return;
            }

            if (field === 'nom') {
                // Mettre à jour le nom du salon et de l'embed
                const oldEmbed = leakMessage.embeds[0];
                const emoji = oldEmbed.title.split(' ')[0]; // Récupérer l'emoji
                
                // Changer le nom du salon
                const newChannelName = `${emoji}${newValue.toLowerCase().replace(/\s+/g, '-')}`;
                await channel.setName(newChannelName);

                // Mettre à jour l'embed
                const newEmbed = new EmbedBuilder()
                    .setTitle(`${emoji} ${newValue}`)
                    .setDescription(oldEmbed.description)
                    .setColor(oldEmbed.color)
                    .setImage(oldEmbed.image?.url || null)
                    .setFooter({ text: `Mis à jour par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                if (oldEmbed.fields && oldEmbed.fields.length > 0) {
                    newEmbed.addFields(oldEmbed.fields);
                }

                await leakMessage.edit({ embeds: [newEmbed] });

            } else if (field === 'description') {
                // Mettre à jour la description
                const oldEmbed = leakMessage.embeds[0];
                
                const newEmbed = new EmbedBuilder()
                    .setTitle(oldEmbed.title)
                    .setDescription(newValue)
                    .setColor(oldEmbed.color)
                    .setImage(oldEmbed.image?.url || null)
                    .setFooter({ text: `Mis à jour par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                if (oldEmbed.fields && oldEmbed.fields.length > 0) {
                    newEmbed.addFields(oldEmbed.fields);
                }

                await leakMessage.edit({ embeds: [newEmbed] });

            } else if (field === 'download') {
                // Mettre à jour le lien de download
                const oldComponents = leakMessage.components[0].components;
                
                const newRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Download')
                            .setEmoji('📥')
                            .setStyle(ButtonStyle.Link)
                            .setURL(newValue),
                        new ButtonBuilder()
                            .setLabel(oldComponents[1].label)
                            .setEmoji(oldComponents[1].emoji?.name || '👁️')
                            .setStyle(ButtonStyle.Link)
                            .setURL(oldComponents[1].url),
                        new ButtonBuilder()
                            .setCustomId(oldComponents[2].customId)
                            .setLabel(oldComponents[2].label)
                            .setEmoji(oldComponents[2].emoji?.name || '⚠️')
                            .setStyle(ButtonStyle.Danger)
                    );

                await leakMessage.edit({ components: [newRow] });

            } else if (field === 'preview') {
                // Mettre à jour le lien de preview et l'image
                const oldEmbed = leakMessage.embeds[0];
                const oldComponents = leakMessage.components[0].components;
                
                const newEmbed = new EmbedBuilder()
                    .setTitle(oldEmbed.title)
                    .setDescription(oldEmbed.description)
                    .setColor(oldEmbed.color)
                    .setFooter({ text: `Mis à jour par ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                // Gérer le preview (YouTube ou image)
                if (isYouTubeUrl(newValue)) {
                    const videoId = extractYouTubeId(newValue);
                    if (videoId) {
                        newEmbed.setImage(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
                        newEmbed.addFields({ name: '🔗 Preview :', value: `[Voir la vidéo](${newValue})`, inline: false });
                    }
                } else {
                    newEmbed.setImage(newValue);
                    newEmbed.addFields({ name: '🔗 Preview :', value: `[Voir l'image](${newValue})`, inline: false });
                }

                const newRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel(oldComponents[0].label)
                            .setEmoji(oldComponents[0].emoji?.name || '📥')
                            .setStyle(ButtonStyle.Link)
                            .setURL(oldComponents[0].url),
                        new ButtonBuilder()
                            .setLabel('Preview')
                            .setEmoji('👁️')
                            .setStyle(ButtonStyle.Link)
                            .setURL(newValue),
                        new ButtonBuilder()
                            .setCustomId(oldComponents[2].customId)
                            .setLabel(oldComponents[2].label)
                            .setEmoji(oldComponents[2].emoji?.name || '⚠️')
                            .setStyle(ButtonStyle.Danger)
                    );

                await leakMessage.edit({ embeds: [newEmbed], components: [newRow] });
            }

            await interaction.followUp({
                content: `✅ Le leak **${channel.name}** a été mis à jour avec succès.`,
                ephemeral: true
            });

            // Supprimer le message de l'utilisateur
            await message.delete().catch(() => {});

            console.log(`Leak mis à jour (${field}) par ${interaction.user.tag}: ${channel.name}`);
        } catch (error) {
            console.error(`Erreur lors de la mise à jour du leak (${field}):`, error);
            await interaction.followUp({
                content: '❌ Une erreur est survenue lors de la mise à jour du leak.',
                ephemeral: true
            });
        }
    });

    collector.on('end', collected => {
        if (collected.size === 0) {
            interaction.followUp({
                content: '⏱️ Temps écoulé. La mise à jour a été annulée.',
                ephemeral: true
            }).catch(() => {});
        }
    });
}

// Fonction pour gérer la création de tickets
async function handleTicketCreation(interaction, customId) {
    const ticketType = customId.split('_')[1];

    // Vérifier si l'utilisateur a déjà un ticket ouvert
    for (const [categoryName, categoryId] of Object.entries(TICKET_CATEGORIES)) {
        const category = interaction.guild.channels.cache.get(categoryId);
        if (category) {
            const existingTicket = category.children.cache.find(
                channel => channel.name === `ticket-${interaction.user.username.toLowerCase()}`
            );
            if (existingTicket) {
                return await interaction.reply({
                    content: `Vous avez déjà un ticket ouvert dans la catégorie ${categoryName} : ${existingTicket}`,
                    ephemeral: true
                });
            }
        }
    }

    // Vérifier si c'est un ticket de recrutement
    if (ticketType === 'recrutement') {
        const recrutementChannel = interaction.guild.channels.cache.get('1303457194192404482');
        if (recrutementChannel) {
            if (recrutementChannel.name.includes('🔒')) {
                return await interaction.reply({
                    content: `Les recrutements sont fermés. Restez informé ici : ${recrutementChannel}`,
                    ephemeral: true
                });
            }
        }
    }

    try {
        // Créer le salon de ticket
        const categoryId = TICKET_CATEGORIES[ticketType];
        const category = interaction.guild.channels.cache.get(categoryId);

        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username.toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: categoryId,
            topic: `Ticket pour ${interaction.user.tag}`,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]
        });

        // Créer l'embed du ticket
        const ticketInfo = TICKET_EMBEDS[ticketType];
        const embed = new EmbedBuilder()
            .setTitle(ticketInfo.title)
            .setDescription(ticketInfo.description)
            .setColor(ticketInfo.color);

        // Créer le bouton de fermeture
        const closeButton = new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('🗑️ Close')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        await ticketChannel.send({ embeds: [embed], components: [row] });

        // Mentionner le rôle approprié
        let roleMention;
        if (['question', 'staff', 'membre'].includes(ticketType)) {
            roleMention = '<@&1303464707784704153>';
        } else {
            roleMention = '<@&1303464584816099339>';
        }

        await ticketChannel.send(roleMention);

        await interaction.reply({
            content: `Ticket créé : ${ticketChannel}`,
            ephemeral: true
        });

        console.log(`Ticket créé par ${interaction.user.tag} dans ${ticketChannel.name}`);

    } catch (error) {
        console.error('Erreur lors de la création du ticket:', error);
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de la création du ticket.',
            ephemeral: true
        });
    }
}

// Fonction pour gérer la fermeture de ticket
async function handleTicketClose(interaction) {
    const ticketChannel = interaction.channel;

    if (!ticketChannel.name.startsWith('ticket-')) {
        return await interaction.reply({
            content: 'Ce salon n\'est pas un ticket.',
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle('Confirmation')
        .setDescription('Êtes-vous sûr de vouloir fermer ce ticket ?')
        .setColor(0xf97316);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket_yes')
                .setLabel('✅ Oui')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('close_ticket_no')
                .setLabel('❌ Non')
                .setStyle(ButtonStyle.Danger)
        );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

// Fonction pour gérer la confirmation de fermeture
async function handleTicketCloseConfirmation(interaction, close) {
    const ticketChannel = interaction.channel;

    if (!ticketChannel.name.startsWith('ticket-')) {
        return await interaction.reply({
            content: 'Ticket introuvable ou non valide.',
            ephemeral: true
        });
    }

    if (close) {
        await interaction.reply({ content: 'Ticket fermé avec succès.', ephemeral: true });
        console.log(`Ticket ${ticketChannel.name} fermé par ${interaction.user.tag}`);
        await ticketChannel.delete();
    } else {
        await interaction.reply({ content: 'Fermeture annulée.', ephemeral: true });
    }
}

// Connexion du bot
client.login(config.token);
