const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('⏭️ Skip the currently playing song.'),
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
            await interaction.client.distube.skip(interaction.guildId);
            await interaction.reply('⏭️ Skipped to the next song!');
        } catch (error) {
            console.error('❌ Skip error:', error);
            await interaction.reply('❌ Unable to skip the song.');
        }
    },
};
