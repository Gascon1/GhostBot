const { SlashCommandBuilder } = require('discord.js');
const { rollDice } = require('../../lib/dice-roll');
const { createAsciiTable } = require('../../lib/create-ascii-table');
const { updateUserRoleAndNickname } = require('../../lib/update-user-role-and-nickname');
const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '../../save.json');

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
    } catch (error) {
      saveData = {};
    }

    console.log(saveData);

    // Check if the user has attempted a revive in the current half-hour
    if (saveData[userId].lastReviveAttemptTime === currentAttemptTime) {
      await interaction.reply(
        `${meepleEmojis.blue.meeple} ${meepleEmojis.red.meeple} __**Revival Council**__ ${meepleEmojis.yellow.meeple} ${meepleEmojis.green.meeple}` +
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
    const colorOrder = ['blue', 'red', 'yellow', 'green'];

    let displayedCoins = colorOrder.map((color) => meepleEmojis[color].coinFlipping);
    let resultsShown = 0;

    await interaction.reply('.');
    await interaction.deleteReply();

    const initialMessage = await interaction.channel.send(`<@${interaction.user.id}>'s fate is being discussed...`);

    await interaction.channel.send(
      `${meepleEmojis.blue.meeple} ${meepleEmojis.red.meeple} __**Revival Council**__ ${meepleEmojis.yellow.meeple} ${meepleEmojis.green.meeple}`,
    );

    const coinMessage = await interaction.channel.send(displayedCoins.join(' '));

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

    await updateUserRoleAndNickname(member, rollResults, deadRole);
  },
};

function getCurrentHalfHour() {
  const currentTime = new Date();
  const currentMinutes = currentTime.getMinutes();
  const currentHalfHour = currentMinutes < 30 ? '00' : '30';
  const currentHour = currentTime.getHours();
  return `${currentHour}:${currentHalfHour}`;
}

const meepleEmojis = {
  blue: {
    meeple: '<:blueMeeple:1305234250739744798>',
    coinFlipping: '<a:blueFlip:1305327395900883034>',
    coinStatic: '<:blue1:1305250818240282714>',
  },
  red: {
    meeple: '<:redMeeple:1305234281727004783>',
    coinFlipping: '<a:redFlip:1305327396852858942>',
    coinStatic: '<:red1:1305250820526313553>',
  },
  yellow: {
    meeple: '<:yellowMeeple:1305234312957919283>',
    coinFlipping: '<a:yellowFlip:1305337174052311051>',
    coinStatic: '<:yellow1:1305250821482479636>',
  },
  green: {
    meeple: '<:greenMeeple:1305234202551128167>',
    coinFlipping: '<a:greenFlip:1305323911940018268>',
    coinStatic: '<:green1:1305250818924220437>',
  },
};

const oopsCoin = '<:oopsCoin:1305251655612366930>';
