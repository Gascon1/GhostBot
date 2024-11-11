const { SlashCommandBuilder } = require('discord.js');
const { rollDice } = require('../../lib/dice-roll');
const { createAsciiTable } = require('../../lib/create-ascii-table');
const { updateUserRoleAndNickname } = require('../../lib/update-user-role-and-nickname');
const { determineAsciiArt } = require('../../lib/determine-ascii-art');
const { determineOdds } = require('../../lib/determine-odds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Rolls X dice with Y sides.')
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
    const { member } = interaction;
    const rolls = interaction.options.getInteger('rolls');
    const sides = interaction.options.getInteger('sides');
    const deadRole = interaction.guild.roles.cache.find((role) => role.name === 'Dead');
    const odds = determineOdds(rolls, sides);
    const rollResults = rollDice(rolls, sides);
    const tableString = createAsciiTable(rolls, sides, rollResults);
    const asciiMessage = determineAsciiArt(rollResults, member, odds, deadRole);

    await interaction.reply(asciiMessage.flavor + '\n' + '```' + '\n' + asciiMessage.art + '\n' + tableString + '```' + '\n' + asciiMessage.end);

    await updateUserRoleAndNickname(member, rollResults, deadRole);
  },
};
