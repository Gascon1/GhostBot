const { SlashCommandBuilder } = require('discord.js');
const { rollDice } = require('../../lib/dice-roll');
const { createAsciiTable } = require('../../lib/create-ascii-table');
const { updateUserRoleAndNickname } = require('../../lib/update-user-role-and-nickname');

module.exports = {
  data: new SlashCommandBuilder().setName('revive').setDescription('Attempt a revival roll to join the living'),
  /**
   * Executes the roll command.
   * @param {import('discord.js').CommandInteraction} interaction - The interaction object.
   */
  async execute(interaction) {
    const rollResults = rollDice(4, 2);
    const tableString = createAsciiTable(4, 2, rollResults);

    await interaction.reply('```' + '\n' + tableString + '```');

    const { member } = interaction;
    const deadRole = interaction.guild.roles.cache.find((role) => role.name === 'Dead');

    await updateUserRoleAndNickname(member, rollResults, deadRole);
  },
};
