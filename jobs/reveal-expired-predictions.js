const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '../save.json');

// This function counts the votes and generates the results display with voter information
async function generateResultsDisplay(prediction, guild) {
  // Count votes for each option
  const voteCount = {};
  prediction.options.forEach((_, index) => {
    voteCount[index] = 0;
  });

  // Group voters by option
  const votersByOption = {};
  prediction.options.forEach((_, index) => {
    votersByOption[index] = [];
  });

  // Count the votes and collect voters
  for (const [userId, optionIndex] of Object.entries(prediction.votes)) {
    if (voteCount[optionIndex] !== undefined) {
      voteCount[optionIndex]++;

      try {
        // Try to fetch the member
        const member = await guild.members.fetch(userId);
        if (member) {
          votersByOption[optionIndex].push(member.user);
        }
      } catch {
        // User might not be in the guild anymore, just add their ID
        votersByOption[optionIndex].push({ id: userId, tag: `Unknown User (${userId})` });
      }
    }
  }

  // Check if there are any winners specified
  const hasWinners = prediction.winners && prediction.winners.length > 0;

  // Generate the results text
  const resultsDisplay = prediction.options
    .map((option, index) => {
      const count = voteCount[index] || 0;
      const isWinner = hasWinners && prediction.winners.includes(index);
      const winnerText = isWinner ? ' 🏆 WINNER' : '';

      // Format the list of voters
      let votersList = '';
      if (votersByOption[index].length > 0) {
        const voterMentions = votersByOption[index]
          .map((user) => {
            // Add a trophy to users who picked the winning option
            const correctPredictionMark = isWinner ? ' 🎯' : '';
            return `<@${user.id}>${correctPredictionMark}`;
          })
          .join(', ');

        votersList = `\n    Voters: ${voterMentions}`;
      } else {
        votersList = '\n    No votes';
      }

      return `${index + 1}. ${option}: ${count} vote(s)${winnerText}${votersList}`;
    })
    .join('\n\n');

  // Get total votes
  const totalVotes = Object.keys(prediction.votes).length;

  // Count how many users predicted correctly
  let correctPredictorsCount = 0;
  if (hasWinners) {
    prediction.winners.forEach((winnerIndex) => {
      correctPredictorsCount += votersByOption[winnerIndex].length;
    });
  }

  // Create a summary of correct predictions
  const correctPredictorsSummary = hasWinners
    ? `\n\n**${correctPredictorsCount}** out of **${totalVotes}** voters predicted correctly! ${correctPredictorsCount > 0 ? '🎊' : ''}`
    : '';

  return {
    resultsDisplay,
    totalVotes,
    correctPredictorsSummary,
  };
}

// Function to update prediction stats for users
function updateUserPredictionStats(saveData, prediction) {
  const hasWinners = prediction.winners && prediction.winners.length > 0;

  // Process each voter
  for (const [userId, optionIndex] of Object.entries(prediction.votes)) {
    // Initialize user in saveData if they don't exist
    if (!saveData[userId]) {
      saveData[userId] = {};
    }

    // Initialize prediction stats if they don't exist
    if (!saveData[userId].predictionStats) {
      saveData[userId].predictionStats = {
        totalPredictions: 0,
        correctPredictions: 0,
        streak: 0,
        highestStreak: 0,
      };
    }

    const stats = saveData[userId].predictionStats;

    // Increment total predictions
    stats.totalPredictions++;

    // Check if this prediction had winners and if the user picked correctly
    if (hasWinners) {
      const userPickedCorrectly = prediction.winners.includes(optionIndex);

      if (userPickedCorrectly) {
        // Increment correct predictions
        stats.correctPredictions++;

        // Increment streak
        stats.streak++;

        // Update highest streak if needed
        if (stats.streak > stats.highestStreak) {
          stats.highestStreak = stats.streak;
        }
      } else {
        // Reset streak on incorrect prediction
        stats.streak = 0;
      }
    }
  }
}

// Create a scheduled task that will be initialized with the Discord client
function createRevealExpiredPredictionsTask(client) {
  // Schedule the task to run every minute to check for expired predictions
  return cron.schedule('* * * * *', async () => {
    // Skip if the client is not ready yet
    if (!client.isReady()) return;

    // Get current time
    const now = new Date();

    // Load save data
    let saveData;
    try {
      saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
    } catch (error) {
      console.error('Error loading save data:', error);
      return;
    }

    // Check if we have predictions data
    if (!saveData.predictions) return;

    // Find predictions with deadlines that have passed and are not yet revealed
    const expiredPredictions = saveData.predictions.filter(
      (pred) => pred.deadline && !pred.isRevealed && new Date(pred.deadline) <= now,
    );

    if (expiredPredictions.length === 0) return;

    console.log(`Found ${expiredPredictions.length} expired predictions to reveal`);

    // Get guild ID from env
    const guildId = process.env.GUILD_ID;
    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      console.error('Could not find guild');
      return;
    }

    // Find the announce channel - by default use the system channel or first text channel
    const announceChannel =
      guild.systemChannel ||
      guild.channels.cache.find((ch) => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages'));

    if (!announceChannel) {
      console.error('Could not find a suitable channel to announce in');
      return;
    }

    // Process each expired prediction
    for (const prediction of expiredPredictions) {
      // Mark as revealed
      prediction.isRevealed = true;

      // Get results
      const { resultsDisplay, totalVotes, correctPredictorsSummary } = await generateResultsDisplay(prediction, guild);

      // Update user prediction stats
      updateUserPredictionStats(saveData, prediction);

      // Send the reveal message
      try {
        await announceChannel.send({
          content: `# 🔮 Prediction Results (Auto-Reveal): ${prediction.title}\n\n${resultsDisplay}\n\n*Total Votes: ${totalVotes}*${correctPredictorsSummary}\n\n*This prediction has been automatically revealed because it reached its deadline.*`,
        });

        console.log(`Auto-revealed prediction: ${prediction.title}`);
      } catch (error) {
        console.error(`Error sending auto-reveal message for prediction ${prediction.id}:`, error);
      }
    }

    // Save the updated data
    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2), 'utf8');

    console.log('Auto-reveal task completed');
  });
}

module.exports = {
  createRevealExpiredPredictionsTask,
  generateResultsDisplay,
  updateUserPredictionStats,
};
