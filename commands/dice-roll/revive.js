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
    const colorOrder = ['blue', 'red', 'yellow', 'green'];
    let displayedCoins = [
      meepleEmojis.blue.coinFlipping,
      meepleEmojis.red.coinFlipping,
      meepleEmojis.yellow.coinFlipping,
      meepleEmojis.green.coinFlipping,
    ];
    let resultsShown = 0;

    await interaction.reply('.');
    await interaction.deleteReply();

    const message = await interaction.channel.send(`<@${interaction.user.id}>'s fate is being discussed...`);

    await interaction.channel.send(
      `${meepleEmojis.blue.meeple} ${meepleEmojis.red.meeple} __**Revival Council**__ ${meepleEmojis.yellow.meeple} ${meepleEmojis.green.meeple}`,
    );

    await interaction.channel.send(displayedCoins.join(' ')).then((msg) => {
      const rollingCoinsInterval = setInterval(async () => {
        displayedCoins[resultsShown] =
          rollResults[resultsShown] === 1 ? oopsCoin : meepleEmojis[colorOrder[resultsShown]].coinStatic;

        await msg.edit(displayedCoins.join(' '));
        if (resultsShown >= 3) {
          message.edit(`<@${interaction.user.id}>'s fate has been sealed`);
          clearInterval(rollingCoinsInterval);
        }
        resultsShown += 1;
      }, 1000);
    });

    const { member } = interaction;
    const deadRole = interaction.guild.roles.cache.find((role) => role.name === 'Dead');

    setTimeout(async () => {
      await updateUserRoleAndNickname(member, rollResults, deadRole);
    }, 4000);
  },
};

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
