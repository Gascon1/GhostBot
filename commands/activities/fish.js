const { SlashCommandBuilder } = require('discord.js');
const { targetRoll, lessThanOrEqual } = require('../../lib/target-roll');
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
    maxRoll: 3,
  },
  {
    name: 'Tropical Fish',
    emoji: '🐠',
    xp: 5,
    requiredLevel: 1,
    maxRoll: 3,
  },
  {
    name: 'Blowfish',
    emoji: '🐡',
    xp: 8,
    requiredLevel: 3,
    maxRoll: 6,
  },
  {
    name: 'Jellyfish',
    emoji: '🪼',
    xp: 10,
    requiredLevel: 5,
    maxRoll: 9,
  },
  {
    name: 'Shark',
    emoji: '🦈',
    xp: 15,
    requiredLevel: 7,
    maxRoll: 12,
  },
  {
    name: 'Whale',
    emoji: '🐋',
    xp: 30,
    requiredLevel: 10,
    maxRoll: 15,
  },
];

// Parameters
const _fishingTimer = 3000;
// XP Display
const bars = 20;
const xpFillSymbol = '■';
const xpEmptySymbol = ' ';

function getExperienceForLevel(level) {
  let points = 0;
  let output = 0;
  for (let lvl = 0; lvl <= level; lvl++) {
    points += Math.floor(lvl + 300.0 * Math.pow(2.0, lvl / 7.0));
    if (lvl >= level) {
      return Math.ceil(output);
    }
    output = Math.floor(points / 4) / 2;
  }
  return 0;
}

function renderXpBar(currentFishingXp, currentFishingLevel, xpToLevelUp) {
  const xpBar = Math.round((currentFishingXp / xpToLevelUp) * bars);
  return (
    `🎣 Fishing Lv${currentFishingLevel}: [2;34m|${xpFillSymbol.repeat(xpBar)}${xpEmptySymbol.repeat(bars - xpBar)}|[0m` +
    ` ${currentFishingXp}/${xpToLevelUp}`
  );
}

module.exports = {
  data: new SlashCommandBuilder().setName('fish').setDescription("It's time to fish!"),
  /**
   * Executes the roll command.
   * @param {import('discord.js').CommandInteraction} interaction - The interaction object.
   */
  async execute(interaction) {
    // #region Setup
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
      '```' +
      '\n' +
      // '𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃𓂃' + '\n' +
      '𓇼 ⋆.˚  𓆝⋆.˚    𓇼 ⋆｡˚ 𓆞' +
      '\n' +
      '𓆉𓆝𓇼𓆟  𖦹°‧𓆝𓆡𓆜 𓆉𓆝𓇼𓆟' +
      '\n' +
      '```';
    const beforeFishingText = '# ' + fishingMeeple.meeple + oceanText;
    // #endregion Setup

    // Sending initial fishing messages
    const beforeFishingMessage = await interaction.reply(beforeFishingText);

    // Fishing XP Logic - Setup
    let currentFishingLevel = saveData[member.id].fishingLevel;
    let currentFishingXp = saveData[member.id].fishingXp;
    let xpToLevelUp = getExperienceForLevel(currentFishingLevel);
    let levelUpText = '';
    let afterFishingText;

    // Select fish
    const fishPoolFiltered = fishPool.filter((fish) => fish.requiredLevel <= saveData[member.id].fishingLevel);
    const fishIndex = Math.floor(Math.random() * fishPoolFiltered.length); // Throws a fit if I do it in the next line
    const selectedFish = fishPoolFiltered[fishIndex];

    // Calculates odd of catching the fish
    const roll = targetRoll(1, selectedFish.maxRoll, currentFishingLevel, lessThanOrEqual);

    // Fishing timer
    await new Promise((resolve) => setTimeout(resolve, _fishingTimer));

    // If fails, abort early and display final message.
    if (!roll.conditionMet) {
      oceanText =
        '\n' +
        '```ansi' +
        '\n' +
        'Nothing happens...' +
        '\n' +
        `${renderXpBar(currentFishingXp, currentFishingLevel, xpToLevelUp)}` +
        '\n' +
        levelUpText +
        '\n' +
        '```';
      afterFishingText = fishingMeeple.meeple + oceanText;

      await beforeFishingMessage.edit(afterFishingText);
      return;
    }

    // If success, add XP
    currentFishingXp += selectedFish.xp;

    // Check if leveling up
    if (currentFishingXp >= xpToLevelUp) {
      // Level up
      currentFishingLevel = saveData[member.id].fishingLevel += 1;
      // Account for XP Overflow
      const xpOverflow = currentFishingXp - xpToLevelUp;
      currentFishingXp = 0 + xpOverflow;

      levelUpText = `🏆 You have leveled up! You are now level ${currentFishingLevel} 🏆`;
      xpToLevelUp = getExperienceForLevel(currentFishingLevel);

      // Check if unlocked a new fish
      const unlockedFish = fishPool.find((fish) => fish.requiredLevel === currentFishingLevel);
      if (unlockedFish) {
        levelUpText += `\n\n🆕 You can now fish: ${unlockedFish.name} ${unlockedFish.emoji}`;
      }
    }

    // Display success final message
    const fishingResultsText =
      '\n' +
      '```ansi' +
      '\n' +
      `You have caught a ${selectedFish.name}${selectedFish.emoji}! +${selectedFish.xp} Fishing XP` +
      '\n' +
      `${renderXpBar(currentFishingXp, currentFishingLevel, xpToLevelUp)}` +
      '\n' +
      levelUpText +
      '\n' +
      '```';

    afterFishingText = '# ' + fishingMeeple.meeple + selectedFish.emoji + fishingResultsText;
    await beforeFishingMessage.edit(afterFishingText);

    // Save new Fishing XP & Level to save.json file
    saveData[member.id].fishingXp = currentFishingXp;
    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2));
  },
};
