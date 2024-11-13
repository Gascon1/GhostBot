const { SlashCommandBuilder } = require('discord.js');
const { rollDice } = require('../../lib/dice-roll');
const { createAsciiTable } = require('../../lib/create-ascii-table');
const { determineAsciiArt } = require('../../lib/determine-ascii-art');
const { handleBetOutcome } = require('../../lib/handle-bet-outcome');
const { determinePerfectRollOdds } = require('../../lib/determine-odds');
const { determineXp } = require('../../lib/determine-xp');
const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '../../save.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fightking')
    .setDescription('Fight the king of ghosts. Roll a perfect 10/10 on a 1d10 to gain another revive attempt.'),

  /**
   * Executes the fightking command.
   * @param {import('discord.js').CommandInteraction} interaction - The interaction object.
   */
  async execute(interaction) {
    const { member } = interaction;
    const deadRole = interaction.guild.roles.cache.find((role) => role.name === 'Dead');

    if (!member.roles.cache.has(deadRole.id)) {
      await interaction.reply('You must be dead to fight the king of ghosts.');
      return;
    }

    // Load save data
    let saveData;
    try {
      saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
    } catch {
      saveData = {};
    }

    const userId = member.user.id;
    const currentTime = Date.now();
    const lastFightTime = saveData[userId]?.lastFightKingTime || 0;

    // Check if 5 minutes have passed since the last fight
    if (currentTime - lastFightTime < 5 * 60 * 1000) {
      await interaction.reply('You can only fight the king of ghosts once every 5 minutes. Please try again later.');
      return;
    }

    const rollResults = rollDice(1, 10);
    const isPerfectRoll = rollResults[0] === 10;
    const tableString = createAsciiTable(1, 10, rollResults);

    const odds = determinePerfectRollOdds(1, 10);
    const xp = determineXp(odds);

    const outcome = isPerfectRoll ? 'neutral' : 'died';
    const asciiMessage = determineAsciiArt(outcome, member, odds, deadRole, xp);

    if (isPerfectRoll) {
      await interaction.reply(
        asciiMessage.flavor +
          '\n' +
          '```' +
          '\n' +
          asciiMessage.art +
          '\n' +
          tableString +
          '```' +
          '\n' +
          'Congratulations! You defeated the king of ghosts and gained another revive attempt!',
      );

      // Reset the last revive attempt time
      handleBetOutcome([member.user.id]);
    } else {
      await interaction.reply(
        asciiMessage.flavor +
          '\n' +
          '```' +
          '\n' +
          asciiMessage.art +
          '\n' +
          tableString +
          '```' +
          '\n' +
          asciiMessage.end,
      );
    }

    // Update the last fight time
    if (!saveData[userId]) {
      saveData[userId] = {};
    }
    saveData[userId].lastFightKingTime = currentTime;
    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2), 'utf8');
  },
};
