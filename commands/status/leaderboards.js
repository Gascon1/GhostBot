const { SlashCommandBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const AsciiTable = require('ascii-table');
const { meepleEmojis } = require('../../lib/meeple-data');

module.exports = {
  data: new SlashCommandBuilder().setName('leaderboards').setDescription('Display the XP leaderboards.'),
  /**
   * Executes the leaderboards command.
   * @param {import('discord.js').CommandInteraction} interaction - The interaction object.
   */
  async execute(interaction) {
    const filePath = path.join(__dirname, '../../save.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const currentXpTable = new AsciiTable('Current XP Leaderboard');
    currentXpTable.setHeading('Rank', 'Meeple', 'XP');
    currentXpTable.setJustify();
    currentXpTable.setAlign(0, AsciiTable.CENTER);
    currentXpTable.setAlign(1, AsciiTable.CENTER);
    currentXpTable.setAlign(2, AsciiTable.CENTER);

    const allTimeHighXpTable = new AsciiTable('All-Time High XP Leaderboard');
    allTimeHighXpTable.setHeading('Rank', 'Meeple', 'XP');
    allTimeHighXpTable.setJustify();
    allTimeHighXpTable.setAlign(0, AsciiTable.CENTER);
    allTimeHighXpTable.setAlign(1, AsciiTable.CENTER);
    allTimeHighXpTable.setAlign(2, AsciiTable.CENTER);

    Object.entries(data)
      .sort(([, a], [, b]) => b.xp - a.xp)
      .forEach(([userId, userData], index) => {
        const userName = Object.values(meepleEmojis).find((meeple) => meeple.userId === userId).userName;

        currentXpTable.addRow(index + 1, userName, userData.xp);
      });

    Object.entries(data)
      .sort(([, a], [, b]) => b.allTimeHighXp - a.allTimeHighXp)
      .forEach(([userId, userData], index) => {
        const userName = Object.values(meepleEmojis).find((meeple) => meeple.userId === userId).userName;

        allTimeHighXpTable.addRow(index + 1, userName, userData.allTimeHighXp);
      });

    await interaction.reply(`\`\`\`
${currentXpTable.toString()}\n\n${allTimeHighXpTable.toString()}\`\`\``);
  },
};
