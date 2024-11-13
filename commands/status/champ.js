const { SlashCommandBuilder } = require('discord.js');
const { meepleEmojis } = require('../../lib/meeple-data');
const path = require('path');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder().setName('champ').setDescription('Check who the current champ is.'),
  /**
   * Executes the status command.
   * @param {import('discord.js').CommandInteraction} interaction - The interaction object.
  */
  async execute(interaction) {
    const filePath = path.join(__dirname, '../../save.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let maxExp = 0;
    let maxExpMeeple = '';
    for (let userId in data) {
      if (data[userId].exp > maxExp) {
        maxExp = data[userId].exp;
        maxExpMeeple = userId;
      }
    }
    
    await interaction.reply(`The current champ is <@${maxExpMeeple}> with ${maxExp} exp! `);
    // await interaction.channel.send(`<:DimmaHat3:1305571116164845689>\n<:DimmiHat2:1305571105960099951>\n<:DimmaHat1:1305571094983610388>\n${meepleEmojis.yellow.meeple}`);
  },
};
