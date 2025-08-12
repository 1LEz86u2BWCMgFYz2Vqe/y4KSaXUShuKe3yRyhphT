require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(process.env.PORT || 3000, () => {
    console.log(`Web server running on port ${process.env.PORT || 3000}`);
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

console.log("test");

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    try {
        const channel = await client.channels.fetch('1395765757060714590');
        if (!channel?.isTextBased()) {
            console.error('Channel not found or not text-based.');
            return;
        }
        await channel.send('hello');
        console.log('Message sent!');
    } catch (err) {
        console.error('Failed to send message:', err);
    }
});

client.login(process.env.SECRET);