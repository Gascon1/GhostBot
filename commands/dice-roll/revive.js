const { SlashCommandBuilder } = require('discord.js');
const { targetRoll, equalTo } = require('../../lib/target-roll');
const { updateUserRoleAndNickname } = require('../../lib/update-user-role-and-nickname');
const { meepleEmojis, oopsCoin } = require('../../lib/meeple-data');
const { shuffle } = require('../../lib/shuffle');

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

    const roll = targetRoll(4, 2, 2, equalTo, true);
    const colorOrder = ['red', 'yellow', 'green', 'blue'];
    // If the rolls array looked like [2, 2, 1, 2], the output of this operation would be like [1, 2, -3, 4]
    const rollsSignedAdjustedIndexes = roll.values.map((value, index) => {
      // Used to be able to differentiate the first roll. Otherwise a 0 cannot be told if it was successful or not
      const adjustedIndex = index + 1;
      if (value === 2) {
        return adjustedIndex;
      }
      return adjustedIndex * -1;
    });

    shuffle(rollsSignedAdjustedIndexes);

    // Reverses the adjustment made above to extract the real index
    const successfullRollsIndexes = rollsSignedAdjustedIndexes.filter((value) => value > 0).map((value) => value - 1);
    const missedRollsIndexes = rollsSignedAdjustedIndexes.filter((value) => value < 0).map((value) => (value + 1) * -1);

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
        if (index + 1 <= successfullRollsIndexes.length) {
          displayedCoins[successfullRollsIndexes[index]] =
            meepleEmojis[colorOrder[successfullRollsIndexes[index]]].coinStatic;
        } else {
          displayedCoins[missedRollsIndexes[index - successfullRollsIndexes.length]] = oopsCoin;
        }
        await coinMessage.edit(displayedCoins.join(' '));

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      await initialMessage.edit(`<@${interaction.user.id}>'s fate has been sealed`);
    }

    await updateCoins();

    const { member } = interaction;
    const deadRole = interaction.guild.roles.cache.find((role) => role.name === 'Dead');

    const outcome = roll.conditionMet ? 'revived' : 'neutral';
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
