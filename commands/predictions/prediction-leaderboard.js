const { SlashCommandBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const AsciiTable = require('ascii-table');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prediction-leaderboard')
    .setDescription('Display the leaderboard for prediction accuracy')
    .addStringOption((option) =>
      option
        .setName('sort')
        .setDescription('How to sort the leaderboard')
        .setRequired(false)
        .addChoices(
          { name: 'Accuracy', value: 'accuracy' },
          { name: 'Total Correct', value: 'correct' },
          { name: 'Total Predictions', value: 'total' },
          { name: 'Streak', value: 'streak' },
          { name: 'Highest Streak', value: 'highestStreak' },
        ),
    ),

  async execute(interaction) {
    const filePath = path.join(__dirname, '../../save.json');

    // Load save data
    let saveData;
    try {
      saveData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return interaction.reply('Error loading prediction stats.');
    }

    // Get sortBy option, default to accuracy
    const sortBy = interaction.options.getString('sort') || 'accuracy';

    // Create a table for the prediction stats
    const leaderboardTable = new AsciiTable('Prediction Leaderboard');

    // Set up table headers based on sort type
    if (sortBy === 'accuracy') {
      leaderboardTable.setHeading('Rank', 'User', 'Accuracy %', 'Correct', 'Total');
    } else if (sortBy === 'correct') {
      leaderboardTable.setHeading('Rank', 'User', 'Correct', 'Total', 'Accuracy %');
    } else if (sortBy === 'total') {
      leaderboardTable.setHeading('Rank', 'User', 'Total', 'Correct', 'Accuracy %');
    } else if (sortBy === 'streak' || sortBy === 'highestStreak') {
      leaderboardTable.setHeading(
        'Rank',
        'User',
        sortBy === 'streak' ? 'Current Streak' : 'Highest Streak',
        'Correct',
        'Total',
      );
    }

    // Configure table layout
    leaderboardTable.setJustify();
    leaderboardTable.setAlign(0, AsciiTable.CENTER);
    leaderboardTable.setAlign(1, AsciiTable.LEFT);
    leaderboardTable.setAlign(2, AsciiTable.CENTER);
    leaderboardTable.setAlign(3, AsciiTable.CENTER);
    leaderboardTable.setAlign(4, AsciiTable.CENTER);

    // Filter users with prediction stats
    const usersWithPredictions = Object.entries(saveData)
      .filter(([, userData]) => userData.predictionStats && userData.predictionStats.totalPredictions > 0)
      // Enhance the data structure with additional fields
      .map(([userId, userData]) => {
        const stats = userData.predictionStats;
        const accuracy = stats.totalPredictions > 0 ? (stats.correctPredictions / stats.totalPredictions) * 100 : 0;

        return {
          userId,
          userName: userData.userName,
          accuracy: accuracy.toFixed(2),
          correctPredictions: stats.correctPredictions,
          totalPredictions: stats.totalPredictions,
          streak: stats.streak || 0,
          highestStreak: stats.highestStreak || 0,
        };
      });

    // Sort the data based on the selected sort criteria
    let sortedUsers;

    /* eslint-disable indent */
    switch (sortBy) {
      case 'accuracy':
        sortedUsers = usersWithPredictions.sort(
          (a, b) => b.accuracy - a.accuracy || b.correctPredictions - a.correctPredictions,
        );
        break;
      case 'correct':
        sortedUsers = usersWithPredictions.sort(
          (a, b) => b.correctPredictions - a.correctPredictions || b.accuracy - a.accuracy,
        );
        break;
      case 'total':
        sortedUsers = usersWithPredictions.sort(
          (a, b) => b.totalPredictions - a.totalPredictions || b.correctPredictions - a.correctPredictions,
        );
        break;
      case 'streak':
        sortedUsers = usersWithPredictions.sort(
          (a, b) => b.streak - a.streak || b.correctPredictions - a.correctPredictions,
        );
        break;
      case 'highestStreak':
        sortedUsers = usersWithPredictions.sort(
          (a, b) => b.highestStreak - a.highestStreak || b.correctPredictions - a.correctPredictions,
        );
        break;
      default:
        sortedUsers = usersWithPredictions.sort((a, b) => b.accuracy - a.accuracy);
    }
    /* eslint-enable indent */

    // Add rows to the table
    sortedUsers.forEach((user, index) => {
      if (sortBy === 'accuracy') {
        leaderboardTable.addRow(
          index + 1,
          user.userName,
          `${user.accuracy}%`,
          user.correctPredictions,
          user.totalPredictions,
        );
      } else if (sortBy === 'correct') {
        leaderboardTable.addRow(
          index + 1,
          user.userName,
          user.correctPredictions,
          user.totalPredictions,
          `${user.accuracy}%`,
        );
      } else if (sortBy === 'total') {
        leaderboardTable.addRow(
          index + 1,
          user.userName,
          user.totalPredictions,
          user.correctPredictions,
          `${user.accuracy}%`,
        );
      } else if (sortBy === 'streak') {
        leaderboardTable.addRow(index + 1, user.userName, user.streak, user.correctPredictions, user.totalPredictions);
      } else if (sortBy === 'highestStreak') {
        leaderboardTable.addRow(
          index + 1,
          user.userName,
          user.highestStreak,
          user.correctPredictions,
          user.totalPredictions,
        );
      }
    });

    // If no users have prediction stats
    if (sortedUsers.length === 0) {
      return interaction.reply('No prediction stats found. Make some predictions first!');
    }

    // Get sort type for display
    let sortTypeDisplay;
    /* eslint-disable indent */
    switch (sortBy) {
      case 'accuracy':
        sortTypeDisplay = 'Accuracy Percentage';
        break;
      case 'correct':
        sortTypeDisplay = 'Total Correct Predictions';
        break;
      case 'total':
        sortTypeDisplay = 'Total Predictions Made';
        break;
      case 'streak':
        sortTypeDisplay = 'Current Prediction Streak';
        break;
      case 'highestStreak':
        sortTypeDisplay = 'Highest Streak';
        break;
      default:
        sortTypeDisplay = 'Prediction Accuracy';
    }
    /* eslint-enable indent */

    // Format the response
    await interaction.reply(
      `**Prediction Leaderboard** (Sorted by ${sortTypeDisplay})\n\`\`\`\n${leaderboardTable.toString()}\n\`\`\``,
    );
  },
};
