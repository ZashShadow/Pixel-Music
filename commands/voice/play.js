const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('play a song with query!')
        .addStringOption(option =>
            option.setName("query")
                .setDescription("song to search for")
                .setRequired(true)
        ),

    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return await interaction.reply('❌ You need to be in a voice channel first!');
        }

        const query = interaction.options.getString("query");
        await interaction.reply(`🔍 Searching "${query}"...`);


        //Render
        console.log("🎯 Slash command - Channel type:", interaction.channel?.type);
        console.log("🎯 Attempting to play song with text channel:", {
            id: interaction.channel?.id,
            type: interaction.channel?.type,
            name: interaction.channel?.name
        });

        // This uses DisTube to join + play automatically
        interaction.client.distube.play(voiceChannel, query, {
            textChannel: interaction.channel,
            member: interaction.member,
        });
    },
};