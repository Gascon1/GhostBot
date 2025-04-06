const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { updateUserPredictionStats } = require('../../jobs/reveal-expired-predictions');

const saveFilePath = path.join(__dirname, '../../save.json');

// This function counts the votes and generates the results display with voter information
async function generateCommandResultsDisplay(prediction, interaction) {
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
        const member = await interaction.guild.members.fetch(userId);
        if (member) {
          votersByOption[optionIndex].push(member.user);
        }
      } catch {
        // User might not be in the guild anymore, just add their ID
        votersByOption[optionIndex].push({ id: userId, tag: `Unknown User (${userId})` });
      }
    }
  }

  // Generate the results text
  const resultsDisplay = prediction.options
    .map((option, index) => {
      const count = voteCount[index] || 0;
      const isWinner = prediction.winners && prediction.winners.includes(index);
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
  if (prediction.winners && prediction.winners.length > 0) {
    prediction.winners.forEach((winnerIndex) => {
      correctPredictorsCount += votersByOption[winnerIndex].length;
    });
  }

  // Create a summary of correct predictions
  const correctPredictorsSummary =
    prediction.winners && prediction.winners.length > 0
      ? `\n\n**${correctPredictorsCount}** out of **${totalVotes}** voters predicted correctly! ${correctPredictorsCount > 0 ? '🎊' : ''}`
      : '';

  return {
    resultsDisplay,
    totalVotes,
    correctPredictorsSummary,
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reveal-prediction')
    .setDescription('Reveal the results of a prediction')
    .addIntegerOption((option) =>
      option.setName('id').setDescription('The ID of the prediction to reveal').setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName('winner').setDescription('Option number that won (optional)').setRequired(false).setMinValue(1),
    )
    .addIntegerOption((option) =>
      option
        .setName('winner2')
        .setDescription('Second option that won if multiple (optional)')
        .setRequired(false)
        .setMinValue(1),
    )
    .addIntegerOption((option) =>
      option
        .setName('winner3')
        .setDescription('Third option that won if multiple (optional)')
        .setRequired(false)
        .setMinValue(1),
    ),
  async execute(interaction) {
    await interaction.deferReply();

    // Load save data
    let saveData;
    try {
      const saveRaw = fs.readFileSync(saveFilePath, 'utf8');
      saveData = JSON.parse(saveRaw);
    } catch {
      return interaction.editReply('Error loading predictions.');
    }

    // Check if predictions array exists
    if (!saveData.predictions || !Array.isArray(saveData.predictions)) {
      return interaction.editReply('No predictions found.');
    }

    // Get prediction ID from the command
    const predictionId = interaction.options.getInteger('id');

    // Find the prediction
    const predictionIndex = saveData.predictions.findIndex((p) => p.id === predictionId);
    if (predictionIndex === -1) {
      return interaction.editReply(`Prediction with ID ${predictionId} not found.`);
    }

    const prediction = saveData.predictions[predictionIndex];

    // Check if already revealed
    if (prediction.isRevealed) {
      return interaction.editReply(`Prediction #${predictionId} has already been revealed.`);
    }

    // Mark as revealed
    prediction.isRevealed = true;

    // Process winner options if provided
    const winnerOption1 = interaction.options.getInteger('winner');
    const winnerOption2 = interaction.options.getInteger('winner2');
    const winnerOption3 = interaction.options.getInteger('winner3');

    // Collect valid winner options
    prediction.winners = [];

    // Add winners if they are valid options
    [winnerOption1, winnerOption2, winnerOption3].forEach((option) => {
      if (option && option >= 1 && option <= prediction.options.length) {
        // Convert from 1-indexed to 0-indexed
        prediction.winners.push(option - 1);
      }
    });

    // Generate the results display
    const { resultsDisplay, totalVotes, correctPredictorsSummary } = await generateCommandResultsDisplay(
      prediction,
      interaction,
    );

    // Update user prediction stats
    updateUserPredictionStats(saveData, prediction);

    // Save the updated data
    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2), 'utf8');

    // Reply with the results
    return interaction.editReply({
      content: `# 🔮 Prediction Results: ${prediction.title}\n\n${resultsDisplay}\n\n*Total Votes: ${totalVotes}*${correctPredictorsSummary}`,
    });
  },
};
