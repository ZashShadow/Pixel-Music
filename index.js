//FFMPEG Conf
const ffmpegPath = require('ffmpeg-static');
process.env.PATH = `${process.env.PATH};${ffmpegPath.replace(/ffmpeg\.exe$/, '')}`;

//Path
const fs = require('node:fs');
const path = require('node:path');

// Require the necessary discord.js classes
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
require('dotenv').config();
const token = process.env.bot_token;

//Distube Classes
const { DisTube } = require('distube');
const { YouTubePlugin } = require('@distube/youtube');
const { SpotifyPlugin } = require("@distube/spotify");
const { YtDlpPlugin } = require('@distube/yt-dlp');

//Disabling Plugin Updates
process.env.YTSR_NO_UPDATE = '1';
process.env.YTDL_NO_UPDATE = '1';

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

//Distube Client Attachment
client.distube = new DisTube(client, {
    emitAddSongWhenCreatingQueue: true,  // ✅ Optional: send message when first song added
    emitAddListWhenCreatingQueue: true,  // ✅ Optional: message for playlist added
    emitNewSongOnly: true, // ✅ Emit only when switching songs
    plugins: [
        new SpotifyPlugin(),
        new YouTubePlugin(),
        new YtDlpPlugin({
            update: false,
            highWaterMark: 128 * 1024 * 1024,
            format: 'bestaudio',
            quality: 'highestaudio'
        }),
    ]
});

//Listen to DisTube events
client.distube
    .on('playSong', (queue, song) => {
        queue.textChannel?.send(`🎶  Now playing: \`${song.name}\``);
    })
    .on('addSong', (queue, song) => {
        queue.textChannel?.send(`✅  Added: \`${song.name}\``);
    })
    // .on('error', (channel, error) => {
    //     console.error('❌ DisTube error:', error);
    //     channel?.send(`❌ Error: ${error.message}`);
    // })
    .on('error', (channel, error) => {
        // This event catches errors within DisTube operations.
        console.error('❌ DisTube error:', error); // Log the full error object for detailed debugging.

        // Safely send an error message to the Discord channel if it exists.
        // The error.message property provides a string description of the error.
        // The `ReferenceError: queue is not defined` you were seeing was likely the `error.message` itself,
        // indicating an internal DisTube issue with accessing a 'queue' object during playback.
        if (channel) {
            channel.send(`❌ An error occurred: \`\`\`${error.message}\`\`\``)
                .catch(err => console.error("Error sending error message to channel:", err));
        } else {
            // If there's no channel to send the error to (e.g., bot not in VC, or channel was deleted).
            console.error("DisTube error occurred, but no channel was available to send the message.", error);
        }
    });

    
//Listen to Discord JS Events, Just The VC This time
client.on('voiceStateUpdate', (oldState, newState) => {
    const voiceChannel = oldState.channel || newState.channel;
    if (!voiceChannel) return;

    // If bot is not in this channel, ignore
    if (!voiceChannel.members.has(client.user.id)) return;

    // Count how many humans are in VC (exclude bots)
    const nonBotMembers = voiceChannel.members.filter(member => !member.user.bot);

    const queue = client.distube.getQueue(voiceChannel.guild.id);
    if (!queue) return;

    if (nonBotMembers.size === 0) {
        queue.pause(); // pause when everyone leaves
        console.log("Paused due to empty VC");
    } else if (queue.paused) {
        queue.resume(); // resume if people rejoin
        console.log("Resumed when someone rejoined");
    }
});

//Gather Commands
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

//Commands Handler, Searches and Executes the correct command
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    if (interaction.isChatInputCommand) {
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
            }
        }
    } else if (interaction.isAutocomplete) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(error);
        }
    }

});


//WebServer For Render
const express = require('express');
const app = express();

// Dummy web server for Render
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(process.env.PORT || 3000, () => {
  console.log(`Web server started on port ${process.env.PORT || 3000}`);
});

// When the client is ready, run this code (only once).
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);