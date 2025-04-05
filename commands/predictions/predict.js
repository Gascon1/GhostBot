const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '../../save.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('predict')
    .setDescription('Vote on an active prediction')
    .addStringOption((option) =>
      option.setName('prediction').setDescription('The prediction to vote on').setRequired(true).setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName('option')
        .setDescription('The option you want to vote for')
        .setRequired(true)
        .setAutocomplete(true),
    ),
  async autocomplete(interaction) {
    console.log('Autocomplete triggered for predict command');
    const focusedOption = interaction.options.getFocused(true);
    const focusedValue = focusedOption.value;
    console.log(`Focused option: ${focusedOption.name}, Value: ${focusedValue}`);

    // Read the save file
    let saveData;
    try {
      saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
      console.log('Save data loaded successfully');

      // Log the predictions array
      if (!saveData.predictions || saveData.predictions.length === 0) {
        console.log('No predictions found in save data');
      } else {
        console.log(`Found ${saveData.predictions.length} predictions in save data`);
      }
    } catch (error) {
      console.error('Error loading save data:', error);
      saveData = {};
      await interaction.respond([]);
      return;
    }

    const predictions = saveData.predictions || [];

    if (focusedOption.name === 'prediction') {
      // Only show non-revealed predictions for voting
      const activePredictions = predictions.filter((pred) => !pred.isRevealed);
      console.log(`Found ${activePredictions.length} active predictions`);

      let filtered = activePredictions;

      if (focusedValue) {
        const lowercasedValue = focusedValue.toLowerCase();
        filtered = activePredictions.filter((pred) => pred.title.toLowerCase().includes(lowercasedValue));
        console.log(`Filtered to ${filtered.length} predictions matching "${focusedValue}"`);
      }

      const choices = filtered
        .map((pred) => ({
          name: pred.title,
          value: pred.id,
        }))
        .slice(0, 25); // Discord only allows 25 choices

      console.log('Responding with prediction choices:', choices);
      await interaction.respond(choices);
    } else if (focusedOption.name === 'option') {
      // For the option selection, show the options of the selected prediction
      const predictionId = interaction.options.getString('prediction');
      console.log(`Getting options for prediction ID: ${predictionId}`);

      if (!predictionId) {
        console.log('No prediction ID provided');
        await interaction.respond([]);
        return;
      }

      const prediction = predictions.find((pred) => pred.id === predictionId);

      if (!prediction) {
        console.log('Prediction not found');
        await interaction.respond([]);
        return;
      }

      console.log(`Found prediction: ${prediction.title} with ${prediction.options.length} options`);
      const options = prediction.options;
      let filtered = options;

      if (focusedValue) {
        const lowercasedValue = focusedValue.toLowerCase();
        filtered = options.filter((option) => option.toLowerCase().includes(lowercasedValue));
        console.log(`Filtered to ${filtered.length} options matching "${focusedValue}"`);
      }

      const choices = filtered
        .map((option, index) => ({
          name: `${index + 1}. ${option}`,
          value: `${index}`, // Store as string for the option index
        }))
        .slice(0, 25);

      console.log('Responding with option choices:', choices);
      await interaction.respond(choices);
    }
  },
  async execute(interaction) {
    const userId = interaction.user.id;
    const predictionId = interaction.options.getString('prediction');
    const optionIndexStr = interaction.options.getString('option');

    if (!optionIndexStr) {
      await interaction.reply({
        content: 'Invalid option selected.',
        ephemeral: true,
      });
      return;
    }

    const optionIndex = parseInt(optionIndexStr);

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
    if (optionIndex < 0 || optionIndex >= prediction.options.length) {
      await interaction.reply({
        content: 'Invalid option selected.',
        ephemeral: true,
      });
      return;
    }

    // Record the vote
    prediction.votes[userId] = optionIndex; // Already 0-indexed

    // Update the prediction in the save data
    saveData.predictions[predictionIndex] = prediction;

    // Save the updated data
    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2));

    // Reply to the user confirming their vote
    await interaction.reply({
      content: `Your vote for "${prediction.title}" has been recorded: ${prediction.options[optionIndex]}\n\nThe results will be hidden until revealed.`,
      ephemeral: true, // Making it ephemeral so only the user who voted can see their choice
    });
  },
};
