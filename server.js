require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    try {
        const channel = await client.channels.fetch('1395765757060714590');
        if (!channel || !channel.isTextBased()) {
            console.error('Channel not found or not text-based.');
            return;
        }
        await channel.send('hello');
        console.log('Message sent!');
    } catch (err) {
        console.error('Failed to send message:', err);
    } finally {
        process.exit(0); // exit after sending
    }
});

client.login(process.env.SECRET);
