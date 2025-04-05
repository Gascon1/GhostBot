const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '../../save.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-test-prediction')
    .setDescription('Creates a test prediction for debugging'),
  async execute(interaction) {
    // Read the save file
    let saveData;
    try {
      saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
      console.log('Save data loaded successfully');
    } catch (error) {
      console.error('Error loading save data:', error);
      saveData = {};
    }

    // Initialize predictions array if it doesn't exist
    if (!saveData.predictions) {
      saveData.predictions = [];
    }

    // Create a unique ID for the prediction
    const predictionId = Date.now().toString();

    // Create the prediction object
    const newPrediction = {
      id: predictionId,
      title: 'Test Prediction',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      createdBy: interaction.user.id,
      createdAt: new Date().toISOString(),
      votes: {},
      isRevealed: false,
      winners: [],
    };

    // Add the prediction to the array
    saveData.predictions.push(newPrediction);

    // Save the updated data
    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2));

    // Log the created prediction
    console.log('Created test prediction:', newPrediction);

    // Reply with confirmation
    await interaction.reply({
      content: `# 🔮 Test Prediction Created\n\nID: ${predictionId}\nTitle: Test Prediction\nOptions: Option 1, Option 2, Option 3, Option 4\n\nThis is for debugging purposes. You can now test the predict command with this prediction.`,
      ephemeral: false,
    });
  },
};
