const { SlashCommandBuilder } = require('discord.js');
const { rollDice } = require('../../lib/dice-roll');
const { meepleEmojis } = require('../../lib/meeple-data');

const fs = require('fs');
const path = require('path');
const saveFilePath = path.join(__dirname, '../../save.json');


const fishPool = [
  {
    name: 'Small Fish',
    emoji: '🐟',
    xp: 2,
    requiredLevel: 1,
    minRoll: 1,
    maxRoll: 3,
  },
  {
    name: 'Tropical Fish',
    emoji: '🐠',
    xp: 5,
    requiredLevel: 1,
    minRoll: 4,
    maxRoll: 6,
  },
  {
    name: 'Jellyfish',
    emoji: '🪼',
    xp: 10,
    requiredLevel: 5,
    minRoll: 7,
    maxRoll: 9,
  },
  {
    name: 'Shark',
    emoji: ':shark:',
    xp: 15,
    requiredLevel: 10,
    minRoll: 10,
    maxRoll: 12,
  },
  {
    name: 'Whale',
    emoji: ':whale:',
    xp: 20,
    requiredLevel: 15,
    minRoll: 13,
    maxRoll: 15,
  },
]

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
const fishXp = 15;


function getExperienceForLevel(level) {
  let points = 0;
  let output = 0;
  for (let lvl = 0; lvl <= level; lvl++) {
      points += Math.floor(lvl + 300.0 * Math.pow(2.0, lvl / 7.0));
      if (lvl >= level) {
          return Math.ceil(output);
      }
      output = Math.floor(points / 4)/2;
  }
  return 0;
}

function renderXpBar(currentFishingXp, currentFishingLevel, xpToLevelUp) {
  const xpBar = Math.round((currentFishingXp / xpToLevelUp) * bars);
  return `🎣 Fishing Lv${currentFishingLevel}: [2;34m|${xpFillSymbol.repeat(xpBar)}${xpEmptySymbol.repeat(bars - xpBar)}|[0m` + ` ${currentFishingXp}/${xpToLevelUp}`
}

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
    let oceanText =
    '\n' +
    '```' + '\n' +
    // '𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃' + '\n' +
    '𓇼 ⋆.˚  𓆝⋆.˚    𓇼 ⋆｡˚ 𓆞' + '\n' +
    '𓆉𓆝𓇼𓆟  𖦹°‧𓆝𓆡𓆜 𓆉𓆝𓇼𓆟' + '\n' +
    '```';
    let beforeFishingText = '# ' + fishingMeeple.meeple + oceanText;

    // Sending initial fishing messages
    // const fishingIntroMessage = await interaction.channel.send(`${member.displayName}` + ' is fishing...\n\n');
    const beforeFishingMessage = await interaction.reply(beforeFishingText);
    // const beforeFishingMessage = await interaction.channel.send(beforeFishingText);
    // const oceanMessage = await interaction.channel.send(oceanText);

    // Fishing timer
    await new Promise((resolve) => setTimeout(resolve, _fishingTimer));

    // Calculates odd of catching a fish
    const rollResults = rollDice(1, 2);
    const isSuccess = rollResults.includes(1) || rollResults.includes(2);
    
    // const afterFishingMessage = isSuccess ? fishingMeeple.meeple + '🐡' : fishingMeeple.meeple;
    
    
    
    // Fishing XP Logic - Calculate XP bar
    let currentFishingXp = saveData[member.id].fishingXp;
    let currentFishingLevel = saveData[member.id].fishingLevel;
    let xpToLevelUp = getExperienceForLevel(currentFishingLevel);
    let levelUpText = "";
    let afterFishingText;
    
    // If fails, abort early and display final message.
    if (!isSuccess) {
      // await oceanMessage.edit(
      //   '```ansi' + '\n' + 
      //   'Nothing happens...' + '\n' +
      //   `${renderXpBar(currentFishingXp, currentFishingLevel, xpToLevelUp)}` + '\n' +
      //   levelUpText + '\n' +
      //   '```'
      // );
      oceanText = 
        '\n' +
        '```ansi' + '\n' + 
        'Nothing happens...' + '\n' +
        `${renderXpBar(currentFishingXp, currentFishingLevel, xpToLevelUp)}` + '\n' +
        levelUpText + '\n' +
        '```';
      afterFishingText = fishingMeeple.meeple + oceanText;
      // Displays results
      await beforeFishingMessage.edit(afterFishingText);
      return;
    }
    
    // If success, add XP
    currentFishingXp += fishXp;
    
    // Check if leveling up
    if (currentFishingXp >= xpToLevelUp) {
      // Level up
      currentFishingLevel = saveData[member.id].fishingLevel += 1;
      // Account for XP Overflow
      const xpOverflow = currentFishingXp - xpToLevelUp;
      currentFishingXp = 0 + xpOverflow;

      levelUpText = `🏆 You have leveled up! You are now level ${currentFishingLevel} 🏆`;
      xpToLevelUp = getExperienceForLevel(currentFishingLevel);
    }
    
    // Display success final message
    const fishingResultsText = 
      '\n' +
      '```ansi' + '\n' + 
      `You have caught a fish! +${fishXp} Fishing XP` + '\n' +
      `${renderXpBar(currentFishingXp, currentFishingLevel, xpToLevelUp)}` + '\n' +
      levelUpText + '\n' +
      '```';

    afterFishingText = '# ' + fishingMeeple.meeple + '🐠' + fishingResultsText;
    await beforeFishingMessage.edit(afterFishingText);
    
    // Update Fishing XP & Level to the save.json file
    saveData[member.id].fishingXp = currentFishingXp;
    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2));
  },
};
