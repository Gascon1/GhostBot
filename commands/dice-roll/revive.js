const { SlashCommandBuilder } = require('discord.js');
const { rollDice } = require('../../lib/dice-roll');
const { updateUserRoleAndNickname } = require('../../lib/update-user-role-and-nickname');
const { meepleEmojis, oopsCoin } = require('../../lib/meeple-data');

const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '../../save.json');

const revivalCouncil = `${meepleEmojis.red.meeple} ${meepleEmojis.yellow.meeple} __**Revival Council**__ ${meepleEmojis.green.meeple} ${meepleEmojis.blue.meeple}`;

module.exports = {
  data: new SlashCommandBuilder().setName('revive').setDescription('Attempt a revival roll to join the living'),
  /**
   * Executes the roll command.
   * @param {import('discord.js').CommandInteraction} interaction - The interaction object.
   */
  async execute(interaction) {
    const userId = interaction.user.id;
    const currentAttemptTime = getCurrentHalfHour();

    // Read the save file
    let saveData;

    try {
      saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
    } catch {
      saveData = {};
    }

    console.log(saveData);

    // Check if the user has attempted a revive in the current half-hour
    if (saveData[userId].lastReviveAttemptTime === currentAttemptTime) {
      await interaction.reply(
        revivalCouncil +
          '\n' +
          'We have already discussed your fate this half-hour. Come back in the next half hour.' +
          '\n' +
          `Revive attempts: ${saveData[userId].reviveAttempts}`,
      );
      return;
    }

    // Update the save file with the current attempt time
    saveData[userId].lastReviveAttemptTime = currentAttemptTime;
    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2));

    const rollResults = rollDice(4, 2);
    const colorOrder = ['red', 'yellow', 'green', 'blue'];

    const displayedCoins = colorOrder.map((color) => meepleEmojis[color].coinFlipping);

    await interaction.reply('.');
    await interaction.deleteReply();

    const initialMessage = await interaction.channel.send(`<@${interaction.user.id}>'s fate is being discussed...`);

    await interaction.channel.send({
      content: revivalCouncil,
      allowedMentions: { parse: [] },
    });

    const coinMessage = await interaction.channel.send({
      content: displayedCoins.join(' '),
      allowedMentions: { parse: [] },
    });

    async function updateCoins() {
      for (let index = 0; index <= 3; index++) {
        displayedCoins[index] = rollResults[index] === 1 ? oopsCoin : meepleEmojis[colorOrder[index]].coinStatic;
        await coinMessage.edit(displayedCoins.join(' '));

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      await initialMessage.edit(`<@${interaction.user.id}>'s fate has been sealed`);
    }

    await updateCoins();

    const { member } = interaction;
    const deadRole = interaction.guild.roles.cache.find((role) => role.name === 'Dead');

    const outcome = rollResults.every((roll) => roll === 2) ? 'revived' : 'neutral';
    await updateUserRoleAndNickname(member, outcome, deadRole);
  },
};

function getCurrentHalfHour() {
  const currentTime = new Date();
  const currentMinutes = currentTime.getMinutes();
  const currentHalfHour = currentMinutes < 30 ? '00' : '30';
  const currentHour = currentTime.getHours();
  return `${currentHour}:${currentHalfHour}`;
}
