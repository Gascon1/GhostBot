const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { meepleEmojis } = require('../../lib/meeple-data');
const database = require('../../lib/database');
const gymService = require('../../lib/services/gym-service');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gym-goal')
    .setDescription('Set your weekly gym goal! 🎯')
    .addIntegerOption((option) =>
      option
        .setName('sessions')
        .setDescription('How many times per week do you want to go to the gym?')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(7),
    ),

  async execute(interaction) {
    const { member } = interaction;
    const weeklyGoal = interaction.options.getInteger('sessions');

    // Get user's meeple emoji
    const userMeeple = Object.values(meepleEmojis).find((meeple) => meeple.userId === member.id);
    const meepleEmoji = userMeeple ? userMeeple.meeple : '👤';

    try {
      // Initialize database if not already done
      if (!database.db) {
        await database.init();
      }

      // Set the weekly goal
      await gymService.setWeeklyGoal(member.id, weeklyGoal);

      // Get current week progress
      const progress = await gymService.getCurrentWeekProgress(member.id);
      const currentStreak = await gymService.calculateWeeklyStreak(member.id);

      let progressText = '';
      if (progress.goalMet) {
        progressText = `🎉 **Goal already achieved this week!** (${progress.sessionsThisWeek}/${weeklyGoal})\n`;
      } else if (progress.sessionsThisWeek > 0) {
        progressText = `📊 **This week:** ${progress.sessionsThisWeek}/${weeklyGoal} sessions (${progress.remaining} more needed)\n`;
      } else {
        progressText = `📊 **This week:** 0/${weeklyGoal} sessions (${progress.remaining} needed)\n`;
      }

      let streakText = '';
      if (currentStreak > 0) {
        streakText = `🔥 **Current streak:** ${currentStreak} week${currentStreak !== 1 ? 's' : ''}!\n`;
      }

      const responseText =
        `# ${meepleEmoji}🎯 Weekly Goal Set!\n` +
        `**New Goal:** ${weeklyGoal} session${weeklyGoal !== 1 ? 's' : ''} per week\n` +
        `${progressText}` +
        `${streakText}\n` +
        `Use \`/gym\` to log workouts and \`/gym-stats\` to track your progress! 💪`;

      await interaction.reply(responseText);
    } catch (error) {
      console.error('Error setting gym goal:', error);
      await interaction.reply({
        content: `${meepleEmoji} Sorry, there was an error setting your gym goal. Please try again later.`,
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
