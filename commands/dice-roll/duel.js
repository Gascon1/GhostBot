const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { rollDice } = require('../../lib/dice-roll');
const { updateUserRoleAndNickname } = require('../../lib/update-user-role-and-nickname');

const meepleEmojis = {
  blue: {
    meeple: '<:blueMeeple:1305234250739744798>',
    coinFlipping: '<a:blueFlip:1305327395900883034>',
    coinStatic: '<:blue1:1305250818240282714>',
    userId: '141305274936983552',
  },
  red: {
    meeple: '<:redMeeple:1305234281727004783>',
    coinFlipping: '<a:redFlip:1305327396852858942>',
    coinStatic: '<:red1:1305250820526313553>',
    userId: '177948962626469889',
  },
  yellow: {
    meeple: '<:yellowMeeple:1305234312957919283>',
    coinFlipping: '<a:yellowFlip:1305337174052311051>',
    coinStatic: '<:yellow1:1305250821482479636>',
    userId: '106555295186051072',
  },
  green: {
    meeple: '<:greenMeeple:1305234202551128167>',
    coinFlipping: '<a:greenFlip:1305323911940018268>',
    coinStatic: '<:green1:1305250818924220437>',
    userId: '134315165171580928',
  },
};

const oopsCoin = '<:oopsCoin:1305251655612366930>';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duel')
    .setDescription('Duel another meeple to a battle to the death.')
    .addUserOption((option) => option.setName('opponent').setDescription('The opponent to duel.').setRequired(true)),
  /**
   * Executes the duel command.
   * @param {import('discord.js').CommandInteraction} interaction - The interaction object.
   */
  async execute(interaction) {
    const { member } = interaction;
    const opponent = interaction.options.getMember('opponent');
    const deadRole = interaction.guild.roles.cache.find((role) => role.name === 'Dead');

    if (!opponent) {
      await interaction.reply('Opponent not found.');
      return;
    }

    const challengerIsDead = member.roles.cache.has(deadRole.id);
    const opponentIsDead = opponent.roles.cache.has(deadRole.id);

    if (challengerIsDead && !opponentIsDead) {
      await interaction.reply('Dead users can only challenge other dead users.');
      return;
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('acceptDuel').setLabel('Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('rejectDuel').setLabel('Reject').setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({
      content: `${opponent}, you have been challenged to a duel by ${member}. Do you accept?`,
      components: [row],
    });

    const filter = (i) => i.user.id === opponent.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60_000 });

    /**
     * Handles the button interaction.
     * @param {import('discord.js').ButtonInteraction} buttonInteraction - The button interaction.
     */
    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.customId === 'acceptDuel') {
        await buttonInteraction.update({ content: `${opponent} accepted the duel!`, components: [] });

        let sides = 20;
        let memberRoll, opponentRoll;

        const challengerMeeple = Object.values(meepleEmojis).find((meeple) => meeple.userId === member.id);
        const opponentMeeple = Object.values(meepleEmojis).find((meeple) => meeple.userId === opponent.id);

        let resultString = '';

        const initialMessage = await interaction.channel.send(
          `# :crossed_swords: ${challengerMeeple.meeple} VS ${opponentMeeple.meeple} :crossed_swords:` + '\n',
        );

        const duelInterval = setInterval(async () => {
          if (sides <= 5) {
            clearInterval(duelInterval);
            return;
          }

          const challengerRollResult = rollDice(1, sides)[0];
          const opponentRollResult = rollDice(1, sides)[0];

          if (sides === 20) {
            resultString += `D${sides}: ${challengerRollResult.toString().padStart(2, ' ')}   -   ${opponentRollResult.toString().padStart(2, ' ')}`;
          } else {
            resultString += `
D${sides}: ${challengerRollResult.toString().padStart(2, ' ')}   -   ${opponentRollResult.toString().padStart(2, ' ')}`;
          }

          await initialMessage.edit(
            `# :crossed_swords: ${challengerMeeple.meeple} VS ${opponentMeeple.meeple} :crossed_swords:` +
              '\n' +
              `\`\`\`${resultString} 
\`\`\``,
          );

          if (challengerRollResult === 1 && opponentRollResult === 1) {
            clearInterval(duelInterval);

            await interaction.followUp('Everyone rolled a 1 and died. No one is victorious!');

            if (!challengerIsDead) {
              await updateUserRoleAndNickname(member, [1], deadRole);
            }

            if (!opponentIsDead) {
              await updateUserRoleAndNickname(opponent, [1], deadRole);
            }

            return;
          }

          if (challengerRollResult === 1) {
            clearInterval(duelInterval);
            await interaction.followUp(`${member} rolled a 1 and died. ${opponent} is victorious!`);

            if (!challengerIsDead) {
              await updateUserRoleAndNickname(member, [1], deadRole);
            }

            if (!challengerIsDead && opponentIsDead) {
              await updateUserRoleAndNickname(opponent, [2, 2, 2, 2], deadRole);
            }

            return;
          }

          if (opponentRollResult === 1) {
            clearInterval(duelInterval);
            await interaction.followUp(`${opponent} rolled a 1 and died. ${member} is victorious!`);

            if (!opponentIsDead) {
              await updateUserRoleAndNickname(opponent, [1], deadRole);
            }

            return;
          }

          sides--;
        }, 1000);
      } else if (buttonInteraction.customId === 'rejectDuel') {
        await buttonInteraction.update({ content: `${opponent} rejected the duel.`, components: [] });
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        await interaction.followUp(`${opponent} did not respond in time. The duel request has expired.`);
      }
    });
  },
};
