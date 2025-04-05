const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '../../save.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-prediction')
    .setDescription('Create a new prediction for users to vote on')
    .addStringOption((option) => option.setName('title').setDescription('Title of the prediction').setRequired(true))
    .addStringOption((option) => option.setName('option1').setDescription('First option to vote for').setRequired(true))
    .addStringOption((option) =>
      option.setName('option2').setDescription('Second option to vote for').setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('option3').setDescription('Third option to vote for (optional)').setRequired(false),
    )
    .addStringOption((option) =>
      option.setName('option4').setDescription('Fourth option to vote for (optional)').setRequired(false),
    )
    .addStringOption((option) =>
      option.setName('option5').setDescription('Fifth option to vote for (optional)').setRequired(false),
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const title = interaction.options.getString('title');
    const option1 = interaction.options.getString('option1');
    const option2 = interaction.options.getString('option2');
    const option3 = interaction.options.getString('option3');
    const option4 = interaction.options.getString('option4');
    const option5 = interaction.options.getString('option5');

    // Read the save file
    let saveData;
    try {
      saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
    } catch {
      saveData = {};
    }

    // Initialize predictions array if it doesn't exist
    if (!saveData.predictions) {
      saveData.predictions = [];
    }

    // Create options array, filtering out undefined options
    const options = [option1, option2, option3, option4, option5].filter(Boolean);

    // Create a unique ID for the prediction
    const predictionId = Date.now().toString();

    // Create the prediction object
    const newPrediction = {
      id: predictionId,
      title,
      options,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      votes: {},
      isRevealed: false,
      winners: [],
    };

    // Add the prediction to the array
    saveData.predictions.push(newPrediction);

    // Save the updated data
    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2));

    // Generate the options display
    const optionsDisplay = options.map((option, index) => `${index + 1}. ${option}`).join('\n');

    // Reply with confirmation
    await interaction.reply({
      content: `# 🔮 Prediction Created: ${title}\n\n**Options:**\n${optionsDisplay}\n\nUsers can now vote using \`/predict\` command! The results will be hidden until revealed.`,
      ephemeral: false,
    });
  },
};
