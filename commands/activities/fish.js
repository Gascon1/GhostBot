const { SlashCommandBuilder } = require('discord.js');
const { rollDice } = require('../../lib/dice-roll');
const { meepleEmojis } = require('../../lib/meeple-data');

const fs = require('fs');
const path = require('path');
const saveFilePath = path.join(__dirname, '../../save.json');


// const fishPool = [
//   {
//     name: 'Bass',
//     emoji: ':fish:',
//     minRoll: 1,
//     maxRoll: 3,
//   },
//   {
//     name: 'Squid',
//     emoji: ':squid:',
//     minRoll: 4,
//     maxRoll: 6,
//   }
// ]

// TODO: Add fish pool
// TODO: XP scaling formula
// TODO: Increase success rate based on level

// Parameters
const _fishingTimer = 3000;
// Display
const bars = 20
const xpFillSymbol = "■"
const xpEmptySymbol = " "

// Debug
const xpToLevelUp = 40;
const fishXp = 2;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fish')
    .setDescription('It\'s time to fish!'),
  /**
   * Executes the roll command.
   * @param {import('discord.js').CommandInteraction} interaction - The interaction object.
   */
  async execute(interaction) {
    // Grab user's emoji
    const { member } = interaction;
    const fishingMeeple = Object.values(meepleEmojis).find((meeple) => meeple.userId === member.id);

    // Read the save file
    let saveData;
    try {
      saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
    } catch {
      saveData = {};
    }
    
    // Setup messages
    let beforeFishingText = fishingMeeple.meeple;
    let oceanText =
      '```' + '\n' +
      '𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃' + '\n' +
      '𓇼 ⋆.˚  𓆝⋆.˚    𓇼 ⋆｡˚ 𓆞' + '\n' +
      '𓆉𓆝𓇼𓆟  𖦹°‧𓆝𓆡𓆜 𓆉𓆝𓇼𓆟' + '\n' +
      '```';

    // Sending initial fishing messages
    await interaction.reply('.');
    await interaction.deleteReply();
    const fishingIntroMessage = await interaction.channel.send(`${member.displayName}` + ' is fishing...\n\n');
    const beforeFishingMessage = await interaction.channel.send(beforeFishingText);
    const oceanMessage = await interaction.channel.send(oceanText);

    // Fishing timer
    await new Promise((resolve) => setTimeout(resolve, _fishingTimer));

    // Calculates odd of catching a fish
    const rollResults = rollDice(1, 3);
    const isSuccess = rollResults.includes(1) || rollResults.includes(2);
    
    const afterFishingMessage = isSuccess ? fishingMeeple.meeple + '🐡' : fishingMeeple.meeple;
    
    // Displays results
    await fishingIntroMessage.edit(`${member.displayName} is done fishing!`);
    await beforeFishingMessage.edit(afterFishingMessage);

    // If fails, abort early.
    if (!isSuccess) {
      await oceanMessage.edit('Nothing happens...');
      return;
    }

    // Fishing XP Logic
    let currentFishingXp = saveData[member.id].fishingXp += 2;
    let maxedOutText = "";

    // Check if maxed out
    if (currentFishingXp >= xpToLevelUp) {
      currentFishingXp = xpToLevelUp;
      maxedOutText = '🏆 You have maxed out your Fishing XP (for now)!';
    }
    // Calculate & display XP bar
    const xpBar = Math.round((currentFishingXp / xpToLevelUp) * bars);
    const fishingResultsText = 
      '```ansi' + '\n' + 
      `You have caught a fish! +${fishXp} Fishing XP` + '\n' +
      `🎣 Fishing XP: [2;34m|${xpFillSymbol.repeat(xpBar)}${xpEmptySymbol.repeat(bars - xpBar)}|[0m` + ` ${currentFishingXp}/${xpToLevelUp}` + '\n' +
      maxedOutText + '\n' +
      '```';
    await oceanMessage.edit(fishingResultsText);

    // Update Fishing XP to the save.json file
    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2));
  },
};
