const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { meepleEmojis } = require('../../lib/meeple-data');
const database = require('../../lib/database');
const gymService = require('../../lib/services/gym-service');

function getDaysAgo(dateString) {
  const date = new Date(dateString + 'T00:00:00'); // Treat as local date
  // Get today in Montreal timezone
  const today = new Date();
  const montrealToday = new Date(today.toLocaleString('en-US', { timeZone: 'America/Montreal' }));
  montrealToday.setHours(0, 0, 0, 0); // Start of day

  const diffTime = montrealToday - date;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gym-stats')
    .setDescription('View gym statistics and leaderboard! 🏆')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('What stats do you want to see?')
        .setRequired(false)
        .addChoices(
          { name: 'Leaderboard', value: 'leaderboard' },
          { name: 'Personal Stats', value: 'personal' },
          { name: 'Recent Activity', value: 'recent' },
        ),
    ),

  async execute(interaction) {
    const { member } = interaction;
    const statsType = interaction.options.getString('type') || 'leaderboard';

    // Get user's meeple emoji
    const userMeeple = Object.values(meepleEmojis).find((meeple) => meeple.userId === member.id);
    const meepleEmoji = userMeeple ? userMeeple.meeple : '👤';

    try {
      // Initialize database if not already done
      if (!database.db) {
        await database.init();
      }

      if (statsType === 'personal') {
        // Show personal stats
        const userSessions = await gymService.getUserGymSessions(member.id);

        if (!userSessions || userSessions.length === 0) {
          await interaction.reply({
            content: `${meepleEmoji} You haven't logged any gym sessions yet! Use \`/gym\` to get started! 💪`,
            flags: [MessageFlags.Ephemeral],
          });
          return;
        }

        const currentStreak = await gymService.calculateUserStreak(member.id);
        const maxStreak = await gymService.getUserMaxStreak(member.id);
        const totalSessions = userSessions.length;
        const lastWorkout = userSessions[0]; // Sessions are ordered by date DESC
        const daysSinceLastWorkout = getDaysAgo(lastWorkout.date);

        // Get recent workouts (first 5 from the already sorted list)
        const recentWorkouts = userSessions
          .slice(0, 5)
          .map((session) => `**${session.date}:** ${session.workout}`)
          .join('\n');

        const embed = new EmbedBuilder()
          .setColor(0x00ae86)
          .setTitle(`${meepleEmoji} Your Gym Stats`)
          .addFields(
            { name: '🔥 Current Streak', value: `${currentStreak} days`, inline: true },
            { name: '🏆 Best Streak', value: `${maxStreak} days`, inline: true },
            { name: '💪 Total Sessions', value: `${totalSessions}`, inline: true },
            {
              name: '📅 Last Workout',
              value:
                daysSinceLastWorkout === 0
                  ? 'Today!'
                  : daysSinceLastWorkout === 1
                    ? 'Yesterday'
                    : `${daysSinceLastWorkout} days ago`,
              inline: false,
            },
            { name: '📝 Recent Workouts', value: recentWorkouts || 'No recent workouts', inline: false },
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } else if (statsType === 'recent') {
        // Show recent activity from all users
        const recentSessions = await gymService.getRecentSessions(10);

        if (recentSessions.length === 0) {
          await interaction.reply('No gym sessions have been logged yet! Use `/gym` to be the first! 🚀');
          return;
        }

        const recentActivity = recentSessions
          .map((session) => {
            const userMeepleData = Object.values(meepleEmojis).find((meeple) => meeple.userId === session.user_id);
            const userEmoji = userMeepleData ? userMeepleData.meeple : '👤';
            const daysAgo = getDaysAgo(session.date);
            const timeText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
            return `${userEmoji} **${timeText}:** ${session.workout}`;
          })
          .join('\n');

        const embed = new EmbedBuilder()
          .setColor(0x00ae86)
          .setTitle('🏃 Recent Gym Activity')
          .setDescription(recentActivity)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } else {
        // Show leaderboard (default)
        const allUserStats = await gymService.getAllUserStats();

        if (allUserStats.length === 0) {
          await interaction.reply('No gym sessions have been logged yet! Use `/gym` to be the first! 🚀');
          return;
        }

        // Calculate streaks for each user and create leaderboard data
        const userStats = [];
        for (const userStat of allUserStats) {
          const currentStreak = await gymService.calculateUserStreak(userStat.user_id);
          const userMeepleData = Object.values(meepleEmojis).find((meeple) => meeple.userId === userStat.user_id);
          const userEmoji = userMeepleData ? userMeepleData.meeple : '👤';

          userStats.push({
            userId: userStat.user_id,
            userEmoji,
            currentStreak,
            totalSessions: userStat.total_sessions,
          });
        }

        // Sort by current streak, then by total sessions
        userStats.sort((a, b) => {
          if (b.currentStreak !== a.currentStreak) {
            return b.currentStreak - a.currentStreak;
          }
          return b.totalSessions - a.totalSessions;
        });

        // Create leaderboard text
        const leaderboard = userStats
          .slice(0, 10) // Top 10
          .map((user, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            return `${medal} ${user.userEmoji} **${user.currentStreak}** day streak (${user.totalSessions} total)`;
          })
          .join('\n');

        const embed = new EmbedBuilder()
          .setColor(0x00ae86)
          .setTitle('🏆 Gym Leaderboard')
          .setDescription(leaderboard)
          .setFooter({ text: 'Ranked by current streak, then total sessions' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error getting gym stats:', error);
      await interaction.reply({
        content: `${meepleEmoji} Sorry, there was an error getting gym statistics. Please try again later.`,
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
