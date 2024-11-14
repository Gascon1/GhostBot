const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Asks the magic 8-ball a question.')
    .addStringOption((option) => option.setName('question').setDescription('The question to ask the magic 8ball.').setRequired(true)),
  async execute(interaction) {
    const question = interaction.options.getString('question');
    
    const answers = [
      'It is certain.',
      'It is decidedly so.',
      'Without a doubt.',
      'Yes definitely.',
      'You may rely on it.',
      'As I see it, yes.',
      'Most likely.',
      'Outlook good.',
      'Yes.',
      'Signs point to yes.',
      'Don\'t count on it.',
      'My reply is no.',
      'My sources say no.',
      'Outlook not so good.',
      'Very doubtful.',
      '🤷🖕'
    ]

    await interaction.reply(`${interaction.member}: ${question}\n\n🎱 __**${answers[Math.floor(Math.random() * answers.length)]}**__`);
  },
};
