const { SlashCommandBuilder } = require('discord.js');
const { targetRoll, equalTo } = require('../../lib/target-roll');
const { createAsciiTable } = require('../../lib/create-ascii-table');
const { determineAsciiArt } = require('../../lib/determine-ascii-art');
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
    const remainingFightAttempts = saveData[userId]?.remainingFightAttempts || 0;

    // Check if any fight attempts left
    if (remainingFightAttempts < 1) {
      await interaction.reply('You ran out of fight attempts. Please try again later.');
      return;
    }

    saveData[userId].remainingFightAttempts -= 1;

    const roll = targetRoll(1, 5, 5, equalTo);
    const tableString = createAsciiTable(1, 5, roll.values);

    const odds = determinePerfectRollOdds(1, 5);
    const xp = determineXp(odds);

    const outcome = roll.conditionMet ? 'neutral' : 'died';
    const asciiMessage = determineAsciiArt(outcome, member, odds, deadRole, xp, true);

    if (roll.conditionMet) {
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

      saveData[userId].lastReviveAttemptTime = null;
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

    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2), 'utf8');
  },
};
