const { SlashCommandBuilder } = require('discord.js');
const { updateUserRoleAndNickname } = require('../../lib/update-user-role-and-nickname');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resurrect')
    .setDescription('Resurrect a user.')
    .addUserOption((option) => option.setName('user').setDescription('The user to resurrect.').setRequired(true)),

  /**
   * Executes the resurrect command.
   * @param {import('discord.js').CommandInteraction} interaction - The interaction object.
   */
  async execute(interaction) {
    const user = interaction.options.getMember('user');
    const deadRole = interaction.guild.roles.cache.find((role) => role.name === 'Dead');

    if (!user) {
      await interaction.reply('User not found.');
      return;
    }

    if (!user.roles.cache.has(deadRole.id)) {
      await interaction.reply('This user is not dead.');
      return;
    }

    await updateUserRoleAndNickname(user, 'revived', deadRole);
    await interaction.reply(`Resurrected <@${user.id}>.`);
  },
};
