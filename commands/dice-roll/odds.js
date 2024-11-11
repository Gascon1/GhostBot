const { SlashCommandBuilder } = require('discord.js');
const { determineOdds } = require('../../lib/determine-odds');
const { updateUserRoleAndNickname } = require('../../lib/update-user-role-and-nickname');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('odds')
        .setDescription('Check the odds for X dice with Y sides.')
        .addIntegerOption((option) =>
            option.setName('rolls').setDescription('The number of dice to roll.').setRequired(true),
        )
        .addIntegerOption((option) =>
            option.setName('sides').setDescription('The number of sides on the dice.').setRequired(true),
        ),
    /**
     * Executes the roll command.
     * @param {import('discord.js').CommandInteraction} interaction - The interaction object.
     */
    async execute(interaction) {
        const rolls = interaction.options.getInteger('rolls');
        const sides = interaction.options.getInteger('sides');
        const odds = determineOdds(rolls, sides);

        await interaction.reply('```' + '\n' + "Here's the odds for " + rolls + "d" + sides + '\n' + "Survival: " + odds + '```');
    },
};
