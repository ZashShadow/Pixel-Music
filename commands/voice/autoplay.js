const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoplay')
        .setDescription('Toggle autoplay (play similar songs automatically)'),

    async execute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction.guildId);
        if (!queue) {
            return interaction.reply("❌ Nothing is playing right now.");
        }

        const autoplayEnabled = queue.toggleAutoplay();
        interaction.reply(`🔁 Autoplay is now **${autoplayEnabled ? 'On' : 'Off'}**.`);
    }
};
