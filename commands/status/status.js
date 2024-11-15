const { SlashCommandBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder().setName('status').setDescription('Check the status of your character.'),
  /**
   * Executes the status command.
   * @param {import('discord.js').CommandInteraction} interaction - The interaction object.
   */
  async execute(interaction) {
    const userId = interaction.user.id;
    const filePath = path.join(__dirname, '../../save.json');

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const userData = data[userId];

    if (!userData) {
      await interaction.reply('User data not found.');

      return;
    }

    const isDead = interaction.member.roles.cache.some((role) => role.name === 'Dead');

    if (isDead) {
      await interaction.reply(
        'Status: Dead :skull:' + '\n' +
        'Revive attempts: ' + userData.reviveAttempts + '\n' +
        'Fishing Level: ' + userData.fishingLevel + '\n');
    } else {
      await interaction.reply(
        'Status: Alive :heart:' + '\n' +
        'XP: ' + userData.xp + '\n' +
        'Fishing Level: ' + userData.fishingLevel + '\n');
    }
  },
};
