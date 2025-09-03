require('dotenv').config();

const express = require('express');
const axios = require('axios');
const {
	Client,
	GatewayIntentBits,
	Partials,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	AttachmentBuilder,
	ActivityType
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const app = express();
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
	],
	partials: [
        Partials.Message, 
        Partials.Channel, 
        Partials.Reaction,
        Partials.GuildMember
    ],
});

const token = process.env.SECRET;
const rest = new REST({
    version: '10'
}).setToken(token);
const gameId = "16168655940";
let rbxToken = process.env.SECRETRBLX;
let numbers = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣"];
var updates = [];

const commands = [{
        name: "ban",
        description: "Ban a player",
        options: [{
                name: "player",
                description: "Username or UserId",
                type: 3,
                required: true
            },
            {
                name: "arg",
                description: "This argument can be empty. You can either provide a reason or a time length (in minutes).",
                type: 3,
                required: false
            },
        ]
    },
    {
        name: "unban",
        description: "Unban a player",
        options: [{
            name: "player",
            description: "Username or UserId",
            type: 3,
            required: true
        }, ]
    },
    {
        name: "check",
        description: "Get information about a player",
        options: [{
            name: "player",
            description: "Username or UserId",
            type: 3,
            required: true
        }]
    },
    {
        name: "servers",
        description: "Get a list of all the servers",
    },
    {
        name: "help",
        description: "Documentation on all the commands.",
    },
    {
        name: "server",
        description: "Get information about a server",
        options: [{
                name: "server",
                description: "Server code",
                type: 3,
                required: true
            },
            {
                name: "chat",
                description: "Get chat feed instead of server infos",
                type: 5,
                required: false
            },
        ]
    },
    {
        name: "chat",
        description: "Send a chat message remotely",
        options: [{
                name: "server",
                description: "Server code",
                type: 3,
                required: true
            },
            {
                name: "text",
                description: "The text you want to type ingame",
                type: 3,
                required: true
            },
        ]
    },
    {
        name: "console",
        description: "Execute console commands remotely",
        options: [{
                name: "server",
                description: "Server code",
                type: 3,
                required: true
            },
            {
                name: "input",
                description: "The text the execute in the console",
                type: 3,
                required: true
            },
            {
                name: "all",
                description: "Every server",
                type: 5,
                required: false
            },
        ]
    },
    {
        name: "datastores",
        description: "Get a text file that contains all the players DataStores",
    },
    {
        name: 'info',
        description: 'Get information about the game.',
        func: (msg) => {
            let gInfos = wlGuilds[msg.guild.id];
            const e = new EmbedBuilder()
                .setTitle(gInfos.Name)
            axios.all([axios.get(`https://games.roblox.com/v1/games?universeIds=${gInfos.UID}`),
                    axios.get(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${gInfos.UID}&size=512x512&format=Png&isCircular=false`),
                ])
                .then(axios.spread((gameinfo, logo) => {
                    e.setThumbnail(logo.data.data[0].imageUrl);
                    let data = gameinfo.data.data[0];
                    let str = "";
                    Object.entries(data).map(([k, v]) => {
                        if (v !== null) {
                            str += `${k} **${v}**\n`
                        }
                    });
                    e.setTitle(data.name)
                    e.setDescription(str)
                    msg.reply({
                        embeds: [e]
                    });
                    return;
                }))
        }
    },
];


const GetFuncFromCmd = (cmd) => {
    for (const [key, value] of Object.entries(commands)) {
        let func = value.func
        if (value.name === cmd && func) {
            return func
        }
    }
}

const startApp = async() => {
    let promise = client.login(token);
    console.log("Starting...");
    promise.catch(function (error) {
        console.error("Discord bot login | " + error);
        process.exit(1);
    });

}
startApp();
    
const GenStr = (l) => {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
    for (var i = 0; i < l; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

const wlGuilds = {
    "241697344360415232": {
        Name: "R&Box",
        UID: "3949562509",
    },
    "1105952261227687946": {
        Name: "CS Notify",
        UID: "1",
    },
}

const sendGameInfo = async() => {
	const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

	try {
		const fetchUniverseId = async(placeId) => {
			const res = await axios.get(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
			return res.data.universeId;
		};

		const getGameData = async(placeId) => {
			const universeId = await fetchUniverseId(placeId);
            const del = 30*1e3;

			await delay(del);
			const gameInfo = await axios.get(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
			
			await delay(del);
			const votes = await axios.get(`https://games.roblox.com/v1/games/votes?universeIds=${universeId}`);
			
			await delay(del);
			const favs = await axios.get(`https://games.roblox.com/v1/games/${universeId}/favorites/count`);

			const info = gameInfo.data.data[0];
			const voteData = votes.data.data[0];

			const likes = voteData.upVotes;
			const dislikes = voteData.downVotes;
			const total = likes + dislikes;
			const ratio = total > 0 ? (likes / total * 100).toFixed(2) : "0.00";

			return {
				name: info.name,
				link: `https://www.roblox.com/games/${placeId}`,
				ratio,
				favorites: favs.data.favoritesCount,
                ccu: info.playing,
                visits: info.visits,
			};
		};

		const data = await getGameData(process.env.PLACEID);
		const channel = await client.channels.fetch('1399038762855563444');
		const embed = new EmbedBuilder()
			.setTitle(data.name)
			.setURL(data.link)
			.setDescription(
				`🌐 **${data.ccu} players**\n⭐ **${data.favorites}**\n👍 **${data.ratio}%**`
			);

		await channel.send({ embeds: [embed] });
	} catch (err) {
		console.error("Failed to send game info:", err.message);
	}
};

client.on("clientReady", async() => {
    console.log("Successfully logged in Discord bot.");
    client.user.setPresence({
        activities: [{ name: 'ROBLOX', type: ActivityType.Playing }],
        status: 'online',
    });

    let botId = '1070340757497577563';
    const Guilds = client.guilds.cache.map(guild => guild.id);
    for (const [key, value] of Object.entries(Guilds)) {
        let gInfos = wlGuilds[value];
        if (gInfos) {
            (async() => {
                try {
                    console.log(`Started refreshing application (/) commands in the ${gInfos.Name} discord server.`);
                    await rest.put(
                        Routes.applicationGuildCommands(botId, value), {
                            body: commands
                        },
                    );
                    console.log(`Successfully reloaded application (/) commands in the ${gInfos.Name} discord server.`);
                } catch (error) {
                    console.error(error);
                }
            })()


        }
    };

    // await sendGameInfo();
    // const updateMins = 60;
	// setInterval(sendGameInfo, updateMins*60*1e3);

    // const resetH = 24;
    // setInterval(() => (console.log("Restarting app"), process.exit(0)), resetH * 60 * 60 * 1e3);

    client.on('interactionCreate', async interaction => {
        if (interaction.member.id !== '259085441448280064') {
            try {
                await interaction.reply({ 
                    content: "You don't have permission to use this command.",
                    ephemeral: true 
                });
            } catch (error) {
                console.error('Permission reply error:', error.code);
            }
            return;
        }

        if (interaction.isButton()) {
            try {
                if (interaction.message.channel.id != 871456134714765332) return;

                const oldE = interaction.message.embeds[0].data;
                oldE.description = oldE.description + "\n\n" + `<@${interaction.user.id}> answered ${interaction.customId === "0" ? "No":"Yes"}`;
                
                await interaction.message.edit({
                    embeds: [oldE],
                    components: []
                });

                if (interaction.customId != "0") {
                    await interaction.deferReply();
                    
                    try {
                        await setUser("ban", Number(interaction.customId), "AltGen", interaction);
                    } catch (error) {
                        console.error('setUser error:', error);
                        const errorEmbed = new EmbedBuilder()
                            .setDescription("An error occurred while processing the ban.")
                            .setColor('#ff0000');
                        
                        await interaction.editReply({ embeds: [errorEmbed] });
                    }
                } else {
                    await interaction.deferReply();
                    await interaction.deleteReply();
                }
            } catch (error) {
                console.error('Button interaction error:', error);
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const cmd = interaction.commandName.toLowerCase();
        const args = interaction.options;

        try {
            client.channels.cache.get('975495174413242378')?.send({
                embeds: [new EmbedBuilder().setDescription(`<@${interaction.member.id}> used the command **${cmd}** ${Object.keys(args._hoistedOptions).length > 0 ? "with the arguments "+JSON.stringify(args._hoistedOptions) : "" }`)]
            });
        } catch (error) {
            console.error('Logging error:', error);
        }

        try {
            if (cmd === 'help') {
                const sEmbed = new EmbedBuilder()
                    .setTitle('List of commands')
                    .setColor('#5865f2');
                
                let str = "";
                for (const [key, value] of Object.entries(commands)) {
                    if (value.name != cmd) {
                        let newStr = `**/${value.name}**`
                        if (value.options) {
                            for (const opt of value.options) {
                                newStr += ` {${opt.name}}`;
                            }
                        }
                        str += newStr + ` - ${value.description} \n`;
                    }
                }
                sEmbed.setDescription(str);
                await interaction.reply({ embeds: [sEmbed] });
                return;
            }

            if (cmd === 'info') {
                await interaction.deferReply();
                try {
                    GetFuncFromCmd(cmd)(interaction);
                } catch (error) {
                    console.error('Info command error:', error);
                    await interaction.editReply({ content: 'An error occurred while fetching game info.' });
                }
                return;
            }

            await interaction.deferReply();

            const sEmbed = new EmbedBuilder()
                .setDescription("Waiting for server...")
                .setColor('#5865f2');

            switch (cmd) {
                case 'check':
                    await PlrCmd(interaction, args.getString("player"));
                    break;
                    
                case "server":
                    const sid = args.getString("server");
                    const getLogs = args.getBoolean("chat");
                    sEmbed.setTitle(`Server: ${sid}`);
                    
                    await interaction.editReply({ embeds: [sEmbed] });
                    
                    const serverPost = {
                        action: 'server',
                        server: sid,
                        getLogs: (getLogs === true ? "chat" : false),
                    };
                    await PostToServer(interaction, { embeds: [sEmbed] }, serverPost);
                    break;
                    
                case "servers":
                    sEmbed.setTitle('List of servers');
                    await interaction.editReply({ embeds: [sEmbed] });
                    await PostToServer(interaction, { embeds: [sEmbed] }, { action: "servers" });
                    break;
                    
                case 'console':
                    const consoleSid = args.getString("server");
                    const consoleStr = args.getString("input");
                    sEmbed.setTitle(`Server: ${consoleSid}`);
                    
                    await interaction.editReply({ embeds: [sEmbed] });
                    
                    const consolePost = {
                        action: 'console',
                        server: consoleSid,
                        input: consoleStr,
                        all: args.getBoolean("all"),
                        user: interaction.member.nickname,
                    };
                    await PostToServer(interaction, { embeds: [sEmbed] }, consolePost);
                    break;
                    
                case 'chat':
                    const chatSid = args.getString("server");
                    const chatStr = args.getString("text");
                    sEmbed.setTitle(`Server: ${chatSid}`);
                    
                    await interaction.editReply({ embeds: [sEmbed] });
                    
                    const chatPost = {
                        action: 'chat',
                        server: chatSid,
                        message: chatStr,
                        user: interaction.member.nickname,
                    };
                    await PostToServer(interaction, { embeds: [sEmbed] }, chatPost);
                    break;
                    
                case "ban":
                    await PlrCmd(interaction, args.getString("player"), args.getString("arg"));
                    break;
                    
                case "unban":
                    await PlrCmd(interaction, args.getString("player"));
                    break;
                    
                case "datastores":
                    sEmbed.setTitle(`Players DataStores`);
                    await interaction.editReply({ embeds: [sEmbed] });
                    
                    const datastorePost = {
                        action: 'datastores',
                        user: interaction.member.nickname,
                    };
                    await PostToServer(interaction, { embeds: [sEmbed] }, datastorePost);
                    break;
                    
                default:
                    await interaction.editReply({ content: 'Unknown command.' });
            }
            
        } catch (error) {
            console.error('Interaction error:', error);
            
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: 'An error occurred while processing your command.',
                        ephemeral: true 
                    });
                } else if (interaction.deferred) {
                    await interaction.editReply({ 
                        content: 'An error occurred while processing your command.' 
                    });
                }
            } catch (replyError) {
                console.error('Failed to send error reply:', replyError);
            }
        }
    });

    client.channels.cache.get('1395765757060714590').send({
        content: `online`,
    });

    app.post("/", express.json({ limit: '15mb' }), async(req, res) => {
        let body = req.body;
        if (body)
            if (!body || !body.key || body.key != rbxToken) {
                var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
                console.log(`Server with the IP ${ip} attempted to post something without the key`);
                return;
            }
        if (body.type === 'response') {
            console.log("got response");
            res.send('Success');
            PostResp(body.msg, body.str);
        }
        else if (body.type === 'file' || body.type === 'postFile') {
            try {
                if (body.str && body.str.length > 8e6) {
                    return res.status(413).send('File too large');
                }
                
                const buffer = Buffer.from(body.str);
                const file = new AttachmentBuilder(buffer, { name: `${body.title}.txt` });
                
                if (body.type === 'file') {
                    let info = body.msg.split(" ");
                    let msg = await client.channels.cache.get(info[0]).messages.fetch(info[1]).catch(e => e);
                    if (!msg) return res.status(404).send('Message not found');
                    await msg.reply({ files: [file] });
                } else {
                    await client.channels.cache.get('1125133941423231116').send({ files: [file] });
                }     
                res.send('Success');
            } catch (error) {
                console.error('File handling error:', error);
                res.status(500).send('Error processing file');
            }
        }
    });
});

const PlrCmd = async(interaction, plr, res) => {
    const cmd = interaction.commandName;
    const reason = res != null ? res : "N/A";
    
    try {
        if (strIsNotNb(plr)) {
            await setUser(cmd, plr, reason, interaction);
        } else {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('yes')
                        .setLabel('Yes (UserId)')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('no')
                        .setLabel('No (Username)')
                        .setStyle(ButtonStyle.Secondary)
                );

            const embed = new EmbedBuilder()
                .setDescription(`Is "${plr}" a UserId?`)
                .setColor('#5865f2');

            await interaction.editReply({
                embeds: [embed],
                components: [row]
            });

            const filter = (i) => {
                return i.user.id === interaction.user.id;
            };

            try {
                const response = await interaction.followUp({ 
                    content: "Waiting for your choice...",
                    ephemeral: true 
                }).then(msg => 
                    msg.awaitMessageComponent({ filter, time: 15000 })
                );

                await response.deferUpdate();
                
                const e = new EmbedBuilder()
                    .setDescription("Waiting for server...")
                    .setColor('#5865f2');

                await interaction.editReply({
                    embeds: [e],
                    components: []
                });

                const userInput = response.customId === "yes" ? Number(plr) : plr;
                await setUser(cmd, userInput, reason, interaction);
                
            } catch (collectorError) {
                const timeoutEmbed = new EmbedBuilder()
                    .setDescription("You took too long to answer.")
                    .setColor('#ff0000');
                    
                await interaction.editReply({
                    embeds: [timeoutEmbed],
                    components: []
                });
            }
        }
    } catch (error) {
        console.error('PlrCmd error:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setDescription("An error occurred while processing the player command.")
            .setColor('#ff0000');
            
        if (interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};


const PostToServer = async(interaction, content, toPost) => {
    try {
        if (!interaction.deferred && !interaction.replied) {
            console.warn('PostToServer called without deferred interaction');
            return;
        }

        let m;
        if (interaction.deferred) {
            await interaction.editReply(content);
            m = await interaction.fetchReply();
        } else {
            m = await interaction.editReply(content);
        }

        console.log("Message posted:", m.id);

        queue.push({
            msg: `${m.channel.id} ${m.id}`,
            ...toPost,
        });

        const embed = m.embeds[0];
        const oldDesc = embed?.description;

        setTimeout(async() => {
            try {
                const newMsg = await m.channel.messages.fetch(m.id).catch(() => null);
                if (!newMsg) return;

                const newEmbed = newMsg.embeds[0];
                const newDesc = newEmbed?.description;

                if (oldDesc === newDesc) {
                    const failedEmbed = new EmbedBuilder(embed)
                        .setDescription(`PostAsync failed (No response from [BSPNP](https://www.roblox.com/games/${gameId}))`);

                    await interaction.editReply({
                        embeds: [failedEmbed]
                    });
                }
            } catch (timeoutError) {
                console.error('Timeout check error:', timeoutError);
            }
        }, 10 * 1000);

    } catch (error) {
        console.error('PostToServer error:', error);
        
        try {
            const errorEmbed = new EmbedBuilder()
                .setDescription("Failed to communicate with game servers.")
                .setColor('#ff0000');
                
            await interaction.editReply({ embeds: [errorEmbed] });
        } catch (replyError) {
            console.error('Failed to send PostToServer error:', replyError);
        }
    }
};


const updateUL = async() => {
    updates = [];
    const channel = client.channels.cache.get('975492551224213514');
    const messages = await channel.messages.fetch({
        limit: 100
    });
    for (const msg of messages) {
        let str = msg[1].content;
        if (str != '' && str.startsWith('```diff')) updates.push(msg[1].content);
    }
};

var queue = [];
const cmds = ["ban", "unban", "kick", "check", "help", "server", "servers", "info", "chat"];
const prefix = "!";

function FoundCmd(cmd) {
    cmd = cmd.toLowerCase();
    return cmds.includes(cmd);
}

function isNb(n) {
    return typeof n === "number"
}

function strIsNotNb(n) {
    return isNaN(Number(n))
}

function getStrFromCmd(str) {
    const args = str.content.split(" ")
    str = str.toString();
    let index = str.indexOf(args[2]);
    return str.slice(index);
}

function isEmpty(t) {
    let res = t.length <= 0;
    t.forEach((v) => {
        if (v == null || v === "") {
            res = true;
        }
    });
    return res;
}

const setUser = async(action, user, param, plrMsg) => {
    let plr = {
        ["Name"]: "Player",
        ["Id"]: "1",
    }

    try {
        if (!isNb(user)) {
            let options = {
                method: 'POST',
                url: 'https://users.roblox.com/v1/usernames/users',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json;charset=UTF-8'
                },
                data: {
                    "usernames": [`${user}`],
                    "excludeBannedUsers": false
                }
            }
            const res = await axios(options);
            const data = res.data.data[0];
            if (!data){
                const errorMsg = `User doesn't exist.`;
                if (plrMsg.editReply) {
                    await plrMsg.editReply({content: errorMsg});
                } else {
                    await plrMsg.edit({content: errorMsg});
                }
                return;
            }
            plr.Name = data.name;
            plr.Id = data.id;
        } else {
            const res = await axios.get(`https://users.roblox.com/v1/users/${user}`);
            const msg = res && res.message;
            if(msg){
                const errorMsg = msg;
                if (plrMsg.editReply) {
                    await plrMsg.editReply({content: errorMsg});
                } else {
                    await plrMsg.edit({content: errorMsg});
                }
                return;
            }
            const data = res.data;
            plr.Name = data.name;
            plr.Id = data.id;
        }

        let editFunc = plrMsg.editReply ? "editReply" : "edit";
        let modId = plrMsg.user ? plrMsg.user.id : plrMsg.mentions?.repliedUser?.id;
        
        const linkToProfile = `https://www.roblox.com/users/${plr.Id}/profile`;
        const embedCheck = new EmbedBuilder()
            .setColor('#5865f2')
            .setDescription('Waiting for server')
            .setTitle(plr.Name)
            .setURL(linkToProfile);

        try {
            const avatarRes = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${plr.Id}&size=60x60&format=Png&isCircular=false`);
            if (avatarRes.status === 200) {
                const img = avatarRes.data.data[0].imageUrl;
                if (img != '') embedCheck.setThumbnail(img);
            }
        } catch (avatarError) {
            console.error('Avatar fetch error:', avatarError);
        }

        const msg = await plrMsg[editFunc]({
            embeds: [embedCheck],
            content: " ",
        });

        try {
            const [profile, friend] = await Promise.all([
                axios.get(`https://users.roblox.com/v1/users/${plr.Id}`),
                axios.get(`https://friends.roblox.com/v1/users/${plr.Id}/friends/count`)
            ]);

            let profileData = profile.data;
            const username = profileData.name;
            
            if (profileData.isBanned) {
                const e = new EmbedBuilder(embedCheck.data);
                e.setDescription(`User is terminated from Roblox`);
                await plrMsg[editFunc]({
                    embeds: [e]
                });
            } else {
                let friendCount = friend.data.count;
                let friendStr;
                if (friendCount > 1)
                    friendStr = `${friendCount} friends`;
                else if (friendCount == 1) {
                    friendStr = `${friendCount} friend`;
                } else {
                    friendStr = `No friends`;
                }
                
                const toPost = {
                    action: action,
                    userId: plr.Id,
                    mod: modId,
                    parameter: param,
                    desc: `\nJoined ${profileData.created.split('T')[0]}\n\n${friendStr}\n\n%s`,
                };
                
                await PostToServer(plrMsg, {
                    embeds: [embedCheck]
                }, toPost);
            }
        } catch (dataError) {
            console.error('User data fetch error:', dataError);
            const errorEmbed = new EmbedBuilder(embedCheck.data);
            errorEmbed.setDescription('Failed to fetch user data from Roblox');
            await plrMsg[editFunc]({
                embeds: [errorEmbed]
            });
        }
        
    } catch (error) {
        console.error('setUser error:', error);
        
        try {
            const errorMsg = 'An error occurred while fetching user information.';
            if (plrMsg.editReply) {
                await plrMsg.editReply({content: errorMsg});
            } else {
                await plrMsg.edit({content: errorMsg});
            }
        } catch (replyError) {
            console.error('Failed to send setUser error:', replyError);
        }
    }
};

async function determineType(action, message, args) {
    if (action === 'help') {
        const e = new EmbedBuilder()
            .setTitle('List of commands')
            .setColor('#5865f2')
            .setDescription('**!servers** - Get a list of all the servers\n**!server** [id] - Get information about a server\n**!check** [plr] - Get information about a player\n**!ban** [plr] [time/reason] - Ban a player\n**!unban** [plr] - Unban a player\n**!kick** [plr] - Kick a player')
        message.reply({
            embeds: [e]
        });
        return
    } else if (action === 'info') {
        GetFuncFromCmd(action)(message);
        return
    } else if (action === 'chat') {
        const sid = args[1];
        const e = new EmbedBuilder()
            .setTitle(`Server: ${sid}`)
            .setColor('#5865f2')
            .setDescription('Waiting for server')
        const msg = getStrFromCmd(message);
        let member = message.guild.members.cache.get(message.author.id);
        let nickname = member ? member.displayName : null;
        let m = await message.reply({
            embeds: [e]
        })
        queue.push({
            action: 'chat',
            server: sid,
            msg: `${m.channel.id} ${m.id}`,
            message: msg,
            user: nickname,
        })
        return
    } else if (action === 'servers') {
        const e = new EmbedBuilder()
            .setTitle('List of servers')
            .setDescription('Waiting for server')
        let m = await message.reply({
            embeds: [e]
        })
        queue.push({
            action: 'servers',
            msg: `${m.channel.id} ${m.id}`,
        })
        return
    }

    if (isEmpty(args) || args.length <= 1) return;

    if (action === 'server') {
        const sid = args[1];
        const getLogs = args[2];
        const e = new EmbedBuilder()
            .setTitle(`Server: ${sid}`)
            .setColor('#5865f2')
            .setDescription('Waiting for server')
        let m = await message.reply({
            embeds: [e]
        })
        queue.push({
            action: 'server',
            server: sid,
            msg: `${m.channel.id} ${m.id}`,
            getLogs: getLogs,
        })
        return;
    }
    const e = new EmbedBuilder()
        .setColor('#5865f2')
        .setDescription("Waiting for server...")
    let botMsg = await message.reply({
        embeds: [e],
        fetchReply: true
    });
    let banParam = "N/A"

    if (args[2] && action == "ban") {
        banParam = strIsNotNb(args[2]) ? getStrFromCmd(message) : args[2]
    }
    if (strIsNotNb(args[1])) {
        setUser(action, args[1], banParam, botMsg);
    } else {
        await botMsg.edit('0) UserId  1) Username').then(async(msg) => {
            const filter = (r, u) => {
                return numbers.includes(r.emoji.name) && u.id === message.author.id;
            }
            const collector = await msg.createReactionCollector({
                filter,
                time: 30 * 1e3
            });
            collector.on('collect', (r, u) => {
                const reaction = r;
                const ind = numbers.findIndex((n) => {
                    return n == reaction.emoji.name;
                });
                if (ind == 0 || ind == 1) {
                    msg.reactions.removeAll()
                    setUser(action, ind == 0 ? Number(args[1]) : args[1], banParam, botMsg);
                } else {
                    msg.edit("something went wrong");
                }
            })
            await msg.react(numbers[0]);
            await msg.react(numbers[1]);
        })
    }
}

const PostResp = async(msg, str) => {
    let info = msg.split(" ");
    let cacheMsg = await client.channels.cache
    .get(info[0])
    ?.messages.fetch(info[1])
    .catch(() => null);

    if (!cacheMsg) return;

    const newEmbed = new EmbedBuilder(cacheMsg.embeds[0].data);
    newEmbed.setDescription(str);
    cacheMsg.edit({
        embeds: [newEmbed]
    });
};

client.on("guildMemberAdd", member => {
    // client.channels.cache.get('1141080028268998746').send({
    //     content: `Welcome to my Discord Server <@${member.id}>. Please read the following text to get started:`,
    //     embeds: [new EmbedBuilder().setDescription(`You need to be verified (using RoVer or Bloxlink) in order to use commands (for in-game). Have fun!`)]
    // });  
});

client.on("guildMemberRemove", member => {
    member.ban({reason: "Left the server"})
    .then(() => console.log(`${member.user.tag} was banned for leaving the server.`))
    .catch(console.error);
});

client.on("messageCreate", async msg => {
    if (msg.author.bot) return;

    const args = msg.content.split(" ");
    const cmd = args[0].substring(1);

    if (msg.content.startsWith(prefix) && FoundCmd(cmd)) {
        if (msg.author.id === '259085441448280064') { //msg.member.roles.cache.has('879382602576986162')){ 
            determineType(cmd.toLowerCase(), msg, args)
        } else {
            msg.reply("You don't have permission to use this command.");
        }
    }
    
    if (msg.channel.id === '1399028653890867272') {
        msg.react("✅");
        msg.react("❌");
    }

    // if (msg.channel.id === '975492551224213514') updateUL();
});
client.on("threadCreate", async(thread) => {
    if (thread.parentId === "1406056999929774111"){
        try {
            const starterMsg = await thread.fetchStarterMessage();
            if (!starterMsg) return;
            await starterMsg.react("✅");
            await starterMsg.react("❌");
        } catch (err) {
            console.error("Failed to react:", err);
        }
    }
});

app.use(express.static("public"));
app.use(express.json());


app.get("/", async function (req, res) {
    console.log("Request debug:");
    console.log("IP:", req.ip);
    console.log("Method:", req.method);
    console.log("URL:", req.originalUrl);
    console.log("Headers:", req.headers);

    res.send(queue[0]);
    queue.shift();
});

app.get('/updates', async(req, res) => {
    res.send(JSON.stringify(updates));
});

let listener = app.listen(process.env.PORT, function () {
    console.log("App is listening to port " + listener.address().port);
});

client.on("error", console.error);