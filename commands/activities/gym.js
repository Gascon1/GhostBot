const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { meepleEmojis } = require('../../lib/meeple-data');
const database = require('../../lib/database');
const gymService = require('../../lib/services/gym-service');

// Gym emojis for variety
const gymEmojis = ['💪', '🏋️', '🏃', '🚴', '🤸', '🏊', '🧘', '🤾'];

function getRandomGymEmoji() {
  return gymEmojis[Math.floor(Math.random() * gymEmojis.length)];
}

function getTodayDateString() {
  // Use Montreal timezone (America/Montreal handles EST/EDT automatically)
  const today = new Date();
  const montrealDate = new Date(today.toLocaleString('en-US', { timeZone: 'America/Montreal' }));
  return montrealDate.toISOString().split('T')[0]; // YYYY-MM-DD format
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gym')
    .setDescription('Log your gym session! 💪')
    .addStringOption((option) =>
      option.setName('workout').setDescription('What did you work on today? (optional)').setRequired(false),
    ),

  async execute(interaction) {
    const { member } = interaction;
    const workoutDescription = interaction.options.getString('workout') || 'General workout';

    // Get user's meeple emoji
    const userMeeple = Object.values(meepleEmojis).find((meeple) => meeple.userId === member.id);
    const meepleEmoji = userMeeple ? userMeeple.meeple : '👤';

    const todayDate = getTodayDateString();

    try {
      // Initialize database if not already done
      if (!database.db) {
        await database.init();
      }

      // Try to log the gym session
      await gymService.logGymSession(member.id, todayDate, workoutDescription);

      // Calculate streak and total sessions
      const currentStreak = await gymService.calculateUserStreak(member.id);
      const userSessions = await gymService.getUserGymSessions(member.id);
      const totalSessions = userSessions.length;

      // Create response message
      const randomGymEmoji = getRandomGymEmoji();
      let streakText = '';

      if (currentStreak > 1) {
        streakText = `🔥 **${currentStreak} day streak!** 🔥\n`;
      } else if (currentStreak === 1) {
        streakText = `🌟 **Day 1 of your streak!** 🌟\n`;
      }

      const responseText =
        `# ${meepleEmoji}${randomGymEmoji} Gym Session Logged!\n` +
        `**Workout:** ${workoutDescription}\n` +
        `**Date:** ${todayDate}\n` +
        `${streakText}` +
        `**Total Sessions:** ${totalSessions}\n\n` +
        `Keep crushing it! 💪`;

      await interaction.reply(responseText);
    } catch (error) {
      if (error.message === 'ALREADY_LOGGED_TODAY') {
        await interaction.reply({
          content: `${meepleEmoji} You've already logged a gym session today! Keep up the great work! 🔥`,
          flags: [MessageFlags.Ephemeral],
        });
      } else {
        console.error('Error logging gym session:', error);
        await interaction.reply({
          content: `${meepleEmoji} Sorry, there was an error logging your gym session. Please try again later.`,
          flags: [MessageFlags.Ephemeral],
        });
      }
    }
  },
};
