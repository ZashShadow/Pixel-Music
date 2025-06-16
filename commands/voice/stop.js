const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('❌ who turned off the music?'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return await interaction.reply('❌ You must be in a voice channel to skip songs.');
        }

        const queue = interaction.client.distube.getQueue(interaction.guildId);
        if (!queue || !queue.songs.length) {
            return await interaction.reply('❌ There is no song currently playing.');
        }

        try {
            await interaction.client.distube.stop(interaction.guildId);
            await interaction.client.distube.voices.leave(interaction.guild.id);
            await interaction.reply('❌ Stopped the song and left!');
        } catch (error) {
            console.error('❌ Stop error:', error);
            await interaction.reply('❌ Unable to stop the song.');
        }
    },
};
