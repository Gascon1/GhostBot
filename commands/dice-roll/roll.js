const { SlashCommandBuilder } = require('discord.js');
const { rollDice } = require('../../src/dice-roll');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Rolls X dice with Y sides.')
    .addIntegerOption((option) =>
      option.setName('rolls').setDescription('The number of dice to roll.').setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName('sides').setDescription('The number of sides on the dice.').setRequired(true),
    ),
  /**
   * Executes the roll command.
   * @param {import('discord.js').CommandInteraction} interaction - The interaction object.
   */
  async execute(interaction) {
    const rolls = interaction.options.getInteger('rolls');
    const sides = interaction.options.getInteger('sides');

    console.log(rolls, sides);

    const rollResults = rollDice(rolls, sides);
    await interaction.reply(`You rolled: ${rollResults.join(', ')}`);

    const { member } = interaction;
    const hasRolledOne = rollResults.includes(1);
    const hasDoubleSix = rollResults.filter((roll) => roll === 6).length >= 2;
    const deadRole = interaction.guild.roles.cache.find((role) => role.name === 'Dead');

    if (hasRolledOne) {
      if (deadRole && !member.roles.cache.has(deadRole.id)) {
        await member.roles.add(deadRole);
        const newNickname = `Ghost of ${member.displayName} 👻`;
        await member.setNickname(newNickname);
        console.log(`Role ${deadRole.name} added to ${member.user.tag} and nickname changed to ${newNickname}`);
      }
    } else if (hasDoubleSix && member.roles.cache.has(deadRole.id)) {
      await member.roles.remove(deadRole);
      const originalNickname = member.displayName.replace(/^Ghost of /, '').replace(/ 👻$/, '');
      await member.setNickname(originalNickname);
      console.log(`Role ${deadRole.name} removed from ${member.user.tag} and nickname restored to ${originalNickname}`);
    } else {
      console.log('No role change required');
    }
  },
};
