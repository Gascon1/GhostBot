const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '../../save.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reveal-prediction')
    .setDescription('Reveal the results of a prediction')
    .addStringOption((option) =>
      option.setName('prediction').setDescription('The prediction to reveal').setRequired(true).setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName('winners')
        .setDescription('The winning option(s) separated by commas (e.g., "1,3" for options 1 and 3)')
        .setRequired(false)
        .setAutocomplete(true),
    ),
  async autocomplete(interaction) {
    console.log('Autocomplete triggered for reveal-prediction command');
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
      // For revealing, prioritize non-revealed predictions but show all
      const orderedPredictions = [
        ...predictions.filter((pred) => !pred.isRevealed),
        ...predictions.filter((pred) => pred.isRevealed),
      ];
      console.log(`Ordered predictions: ${orderedPredictions.length} total, with non-revealed first`);

      let filtered = orderedPredictions;

      if (focusedValue) {
        const lowercasedValue = focusedValue.toLowerCase();
        filtered = orderedPredictions.filter((pred) => pred.title.toLowerCase().includes(lowercasedValue));
        console.log(`Filtered to ${filtered.length} predictions matching "${focusedValue}"`);
      }

      const choices = filtered
        .map((pred) => ({
          name: `${pred.title}${pred.isRevealed ? ' (Already Revealed)' : ''}`,
          value: pred.id,
        }))
        .slice(0, 25); // Discord only allows 25 choices

      console.log('Responding with prediction choices:', choices);
      await interaction.respond(choices);
    } else if (focusedOption.name === 'winners') {
      // For selecting winners, show the options of the selected prediction with checkboxes
      const predictionId = interaction.options.getString('prediction');
      console.log(`Getting winner options for prediction ID: ${predictionId}`);

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

      // If already revealed, show a message
      if (prediction.isRevealed) {
        console.log('Prediction is already revealed');
        await interaction.respond([
          {
            name: 'This prediction has already been revealed.',
            value: 'already_revealed',
          },
        ]);
        return;
      }

      // Check for existing input and handle accordingly
      if (focusedValue) {
        console.log(`Processing focused value: ${focusedValue}`);
        // Parse the comma-separated list of selected indices
        const selectedValues = focusedValue.split(',').map((v) => v.trim());
        console.log(`Parsed selected values: ${JSON.stringify(selectedValues)}`);

        // Convert last one (being edited) to lowercase for case-insensitive search
        if (selectedValues.length > 0) {
          const lastValue = selectedValues[selectedValues.length - 1].toLowerCase();
          console.log(`Last value being edited: "${lastValue}"`);

          // Filter options based on the current search term
          const matchingOptions = prediction.options
            .map((option, index) => ({ option, index }))
            .filter(({ option }) => option.toLowerCase().includes(lastValue));
          console.log(`Found ${matchingOptions.length} matching options`);

          const choices = matchingOptions
            .map(({ option, index }) => ({
              name: `${index + 1}. ${option}`,
              value:
                selectedValues.length > 1 ? `${selectedValues.slice(0, -1).join(',')},${index + 1}` : `${index + 1}`,
            }))
            .slice(0, 25);

          console.log('Responding with filtered winner choices:', choices);
          await interaction.respond(choices);
          return;
        }
      }

      // If no filtering, show all options
      const choices = prediction.options
        .map((option, index) => ({
          name: `${index + 1}. ${option}`,
          value: `${index + 1}`,
        }))
        .slice(0, 25);

      console.log('Responding with all winner choices:', choices);
      await interaction.respond(choices);
    }
  },
  async execute(interaction) {
    const predictionId = interaction.options.getString('prediction');
    const winnersInput = interaction.options.getString('winners');

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
    if (winnersInput) {
      const winnerNumbers = winnersInput.split(',').map((num) => parseInt(num.trim()));
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
