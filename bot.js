const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

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

// Créer le serveur Express pour le callback
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Stockage temporaire des sessions de vérification
const verificationSessions = new Map();

// Fichier pour stocker les vérifications
const VERIFICATIONS_FILE = path.join(__dirname, 'verifications.txt');

// S'assurer que le fichier existe
if (!fs.existsSync(VERIFICATIONS_FILE)) {
    fs.writeFileSync(VERIFICATIONS_FILE, '');
}

// Fonction pour sauvegarder une vérification
function saveVerification(userId, ip) {
    const data = `id: ${userId}\nip: ${ip}\n\n`;
    fs.appendFileSync(VERIFICATIONS_FILE, data);
}

// Fonction pour envoyer au webhook
async function sendToWebhook(user, ip) {
    try {
        const embed = new EmbedBuilder()
            .setTitle('✅ Nouvelle Vérification')
            .setColor('#00FF00')
            .addFields(
                { name: 'Utilisateur', value: `<@${user.id}>`, inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'IP', value: ip, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Système de Vérification' });

        await axios.post(config.webhook, {
            content: `<@${user.id}>`,
            embeds: [embed.toJSON()]
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi au webhook:', error);
    }
}

// Route de callback
app.get('/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).send('Paramètres manquants');
    }

    // Récupérer la session de vérification
    const session = verificationSessions.get(state);
    if (!session) {
        return res.status(400).send('Session invalide ou expirée');
    }

    try {
        // Récupérer l'IP de l'utilisateur
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Récupérer le membre Discord
        const guild = client.guilds.cache.get(session.guildId);
        if (!guild) {
            return res.status(500).send('Serveur Discord introuvable');
        }

        const member = await guild.members.fetch(session.userId);
        if (!member) {
            return res.status(500).send('Membre introuvable');
        }

        // Ajouter le rôle
        await member.roles.add(config.roleId);

        // Sauvegarder la vérification
        saveVerification(session.userId, ip);

        // Envoyer au webhook
        await sendToWebhook(member.user, ip);

        // Supprimer la session
        verificationSessions.delete(state);

        // Envoyer une réponse de succès
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Vérification Réussie</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                        text-align: center;
                        max-width: 400px;
                    }
                    h1 {
                        color: #00FF00;
                        margin-bottom: 20px;
                    }
                    p {
                        color: #333;
                        font-size: 18px;
                    }
                    .checkmark {
                        font-size: 80px;
                        color: #00FF00;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="checkmark">✓</div>
                    <h1>Vérification Réussie!</h1>
                    <p>Vous avez été vérifié avec succès. Vous pouvez maintenant fermer cette page et retourner sur Discord.</p>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        res.status(500).send('Erreur lors de la vérification');
    }
});

// Route pour initier la vérification
app.get('/verify', (req, res) => {
    const { userId, guildId, sessionId } = req.query;

    if (!userId || !guildId || !sessionId) {
        return res.status(400).send('Paramètres manquants');
    }

    // Créer une session de vérification
    verificationSessions.set(sessionId, {
        userId,
        guildId,
        timestamp: Date.now()
    });

    // Rediriger vers le site de vérification
    res.redirect(`https://discordverify.infinityfreeapp.com?state=${sessionId}`);
});

// Nettoyer les sessions expirées toutes les 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of verificationSessions.entries()) {
        if (now - session.timestamp > 300000) { // 5 minutes
            verificationSessions.delete(sessionId);
        }
    }
}, 300000);

// Événement quand le bot est prêt
client.once('ready', () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    console.log(`🌐 Serveur de callback démarré sur le port ${config.callbackPort}`);
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

// Démarrer le serveur Express
app.listen(config.callbackPort, () => {
    console.log(`Serveur de callback en écoute sur le port ${config.callbackPort}`);
});

// Connexion du bot
client.login(config.token);
