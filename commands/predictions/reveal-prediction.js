const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '../../save.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reveal-prediction')
    .setDescription('Reveal the results of a prediction')
    .addStringOption((option) =>
      option
        .setName('prediction_id')
        .setDescription('ID of the prediction to reveal')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName('winner')
        .setDescription('The winning option number(s) separated by commas (e.g., "1,3" for options 1 and 3)')
        .setRequired(false),
    ),
  async autocomplete(interaction) {
    // Read the save file to get predictions
    let saveData;
    try {
      saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
    } catch {
      saveData = {};
      return;
    }

    const predictions = saveData.predictions || [];
    // Show both revealed and non-revealed predictions in autocomplete

    const focusedValue = interaction.options.getFocused();
    let filtered = predictions;

    if (focusedValue) {
      const lowercasedValue = focusedValue.toLowerCase();
      filtered = predictions.filter(
        (pred) => pred.title.toLowerCase().includes(lowercasedValue) || pred.id.includes(lowercasedValue),
      );
    }

    await interaction.respond(
      filtered
        .map((pred) => ({
          name: `${pred.title} ${pred.isRevealed ? '(Already Revealed)' : ''} (ID: ${pred.id})`,
          value: pred.id,
        }))
        .slice(0, 25), // Discord only allows 25 choices
    );
  },
  async execute(interaction) {
    const predictionId = interaction.options.getString('prediction_id');
    const winnerInput = interaction.options.getString('winner');

    // Read the save file
    let saveData;
    try {
      saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
    } catch {
      saveData = {};
    }

    // Check if predictions exist
    if (!saveData.predictions || saveData.predictions.length === 0) {
      await interaction.reply({
        content: 'There are no predictions to reveal.',
        ephemeral: true,
      });
      return;
    }

    // Find the prediction
    const predictionIndex = saveData.predictions.findIndex((pred) => pred.id === predictionId);
    if (predictionIndex === -1) {
      await interaction.reply({
        content: 'Could not find that prediction. It may have been removed.',
        ephemeral: true,
      });
      return;
    }

    const prediction = saveData.predictions[predictionIndex];

    // Check if prediction is already revealed
    if (prediction.isRevealed) {
      await interaction.reply({
        content: 'This prediction has already been revealed.',
        ephemeral: true,
      });
      return;
    }

    // Mark prediction as revealed
    prediction.isRevealed = true;

    // Initialize winners array
    prediction.winners = [];

    // Process winners if specified
    if (winnerInput) {
      const winnerNumbers = winnerInput.split(',').map((num) => parseInt(num.trim()));
      const validWinnerNumbers = winnerNumbers.filter(
        (num) => !isNaN(num) && num >= 1 && num <= prediction.options.length,
      );

      if (validWinnerNumbers.length > 0) {
        prediction.winners = validWinnerNumbers.map((num) => num - 1); // Store 0-indexed
      }
    }

    // Count votes for each option
    const voteCount = {};
    prediction.options.forEach((_, index) => {
      voteCount[index] = 0;
    });

    // Count the votes
    Object.values(prediction.votes).forEach((optionIndex) => {
      if (voteCount[optionIndex] !== undefined) {
        voteCount[optionIndex]++;
      }
    });

    // Update the prediction in the save data
    saveData.predictions[predictionIndex] = prediction;

    // Save the updated data
    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2));

    // Generate the results display
    const resultsDisplay = prediction.options
      .map((option, index) => {
        const count = voteCount[index] || 0;
        const isWinner = prediction.winners.includes(index);
        const winnerText = isWinner ? ' 🏆 WINNER' : '';
        return `${index + 1}. ${option}: ${count} vote(s)${winnerText}`;
      })
      .join('\n');

    // Get total votes
    const totalVotes = Object.keys(prediction.votes).length;

    // Reply with the results
    await interaction.reply({
      content: `# 🔮 Prediction Results: ${prediction.title}\n\n${resultsDisplay}\n\n*Total Votes: ${totalVotes}*`,
      ephemeral: false,
    });
  },
};
