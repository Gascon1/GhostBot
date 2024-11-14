const { SlashCommandBuilder } = require('discord.js');
const { rollDice } = require('../../lib/dice-roll');
const { createAsciiTable } = require('../../lib/create-ascii-table');
const { updateUserRoleAndNickname } = require('../../lib/update-user-role-and-nickname');
const { determineAsciiArt } = require('../../lib/determine-ascii-art');
const { determineOdds } = require('../../lib/determine-odds');
const { determineXp } = require('../../lib/determine-xp');
const { meepleEmojis } = require('../../lib/meeple-data');

const fs = require('fs');
const path = require('path');
const saveFilePath = path.join(__dirname, '../../save.json');


const fishPool = [
  {
    name: 'Bass',
    emoji: ':fish:',
    minRoll: 1,
    maxRoll: 3,
  },
  {
    name: 'Squid',
    emoji: ':squid:',
    minRoll: 4,
    maxRoll: 6,
  }
]

// Parameters
let fishingTimer = 3000;


module.exports = {
  data: new SlashCommandBuilder()
    .setName('fish')
    .setDescription('It\'s time to fish!'),
  /**
   * Executes the roll command.
   * @param {import('discord.js').CommandInteraction} interaction - The interaction object.
   */
  async execute(interaction) {
    // Read the save file
    let saveData;
    try {
      saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
    } catch {
      saveData = {};
    }

    // Grab user's emoji
    const { member } = interaction;
    const fishingMeeple = Object.values(meepleEmojis).find((meeple) => meeple.userId === member.id);
    
    // Setup messages
    let beforeFishingText = fishingMeeple.meeple;
    let oceanText =
      '```' + '\n' +
      '𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃' + '\n' +
      '𓇼 ⋆.˚  𓆝⋆.˚    𓇼 ⋆｡˚ 𓆞' + '\n' +
      '𓆉𓆝𓇼𓆟  𖦹°‧𓆝𓆡𓆜 𓆉𓆝𓇼𓆟' + '\n' +
      '```';

    // Sending initial fishing messages
    await interaction.reply(member.displayName + ' is fishing...\n\n');
    const beforeFishingMessage = await interaction.channel.send(beforeFishingText);
    const oceanMessage = await interaction.channel.send(oceanText);

    // Fishing timer
    await new Promise((resolve) => setTimeout(resolve, fishingTimer));

    // Calculates odd of catching a fish
    const rollResults = rollDice(1, 3);
    const isSuccess = rollResults.includes(1);
    const outcome = isSuccess ? 'Nothing happens...' : 'You caught a fish!';

    if (isSuccess) {
      saveData[userId].fishingXp += 2;
    }

    let afterFishingMessage = isSuccess ? fishingMeeple.meeple : fishingMeeple.meeple + '🐠';
    
    // Displays results
    await beforeFishingMessage.edit(afterFishingMessage);
    await oceanMessage.edit('\n' + outcome);

  },
};
