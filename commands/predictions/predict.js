const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '../../save.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('predict')
    .setDescription('Vote on an active prediction')
    .addStringOption((option) =>
      option
        .setName('prediction_id')
        .setDescription('ID of the prediction to vote on')
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('option_number')
        .setDescription('The option number you want to vote for')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(4),
    ),
  async autocomplete(interaction) {
    // Read the save file to get active predictions
    let saveData;
    try {
      saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
    } catch {
      saveData = {};
      return;
    }

    const predictions = saveData.predictions || [];
    const activePredictions = predictions.filter((pred) => !pred.isRevealed);

    const focusedValue = interaction.options.getFocused();
    let filtered = activePredictions;

    if (focusedValue) {
      const lowercasedValue = focusedValue.toLowerCase();
      filtered = activePredictions.filter(
        (pred) => pred.title.toLowerCase().includes(lowercasedValue) || pred.id.includes(lowercasedValue),
      );
    }

    await interaction.respond(
      filtered
        .map((pred) => ({
          name: `${pred.title} (ID: ${pred.id})`,
          value: pred.id,
        }))
        .slice(0, 25), // Discord only allows 25 choices
    );
  },
  async execute(interaction) {
    const userId = interaction.user.id;
    const predictionId = interaction.options.getString('prediction_id');
    const optionNumber = interaction.options.getInteger('option_number');

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
        content: 'There are no active predictions to vote on.',
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
        content: 'This prediction has already been revealed and is no longer accepting votes.',
        ephemeral: true,
      });
      return;
    }

    // Check if option is valid
    if (optionNumber > prediction.options.length) {
      await interaction.reply({
        content: `Invalid option. This prediction only has ${prediction.options.length} options.`,
        ephemeral: true,
      });
      return;
    }

    // Record the vote
    prediction.votes[userId] = optionNumber - 1; // Store 0-indexed

    // Update the prediction in the save data
    saveData.predictions[predictionIndex] = prediction;

    // Save the updated data
    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2));

    // Reply to the user confirming their vote
    await interaction.reply({
      content: `Your vote for "${prediction.title}" has been recorded: ${prediction.options[optionNumber - 1]}\n\nThe results will be hidden until revealed.`,
      ephemeral: true, // Making it ephemeral so only the user who voted can see their choice
    });
  },
};
