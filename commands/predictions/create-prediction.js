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
    )
    .addStringOption((option) =>
      option
        .setName('deadline')
        .setDescription('Deadline for voting (format: YYYY-MM-DD HH:MM, e.g., 2023-12-31 23:59)')
        .setRequired(false),
    )
    .addUserOption((option) =>
      option.setName('exclude1').setDescription('User to exclude from voting (optional)').setRequired(false),
    )
    .addUserOption((option) =>
      option.setName('exclude2').setDescription('User to exclude from voting (optional)').setRequired(false),
    )
    .addUserOption((option) =>
      option.setName('exclude3').setDescription('User to exclude from voting (optional)').setRequired(false),
    )
    .addUserOption((option) =>
      option.setName('exclude4').setDescription('User to exclude from voting (optional)').setRequired(false),
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const title = interaction.options.getString('title');
    const option1 = interaction.options.getString('option1');
    const option2 = interaction.options.getString('option2');
    const option3 = interaction.options.getString('option3');
    const option4 = interaction.options.getString('option4');
    const option5 = interaction.options.getString('option5');
    const deadlineString = interaction.options.getString('deadline');

    // Get excluded users
    const excludedUser1 = interaction.options.getUser('exclude1');
    const excludedUser2 = interaction.options.getUser('exclude2');
    const excludedUser3 = interaction.options.getUser('exclude3');
    const excludedUser4 = interaction.options.getUser('exclude4');

    // Create array of excluded user IDs, filtering out undefined values
    const excludedUsers = [excludedUser1, excludedUser2, excludedUser3, excludedUser4]
      .filter(Boolean)
      .map((user) => user.id);

    // Process deadline if provided
    let deadline = null;
    if (deadlineString) {
      const parsedDeadline = new Date(deadlineString);

      // Check if it's a valid future date
      if (isNaN(parsedDeadline.getTime())) {
        await interaction.reply({
          content: 'Invalid deadline format. Please use YYYY-MM-DD HH:MM format (e.g., 2023-12-31 23:59).',
          ephemeral: true,
        });
        return;
      }

      const now = new Date();
      if (parsedDeadline <= now) {
        await interaction.reply({
          content: 'Deadline must be in the future.',
          ephemeral: true,
        });
        return;
      }

      deadline = parsedDeadline.toISOString();
    }

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
      deadline,
      votes: {},
      isRevealed: false,
      winners: [],
      excludedUsers: excludedUsers,
    };

    // Add the prediction to the array
    saveData.predictions.push(newPrediction);

    // Save the updated data
    fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2));

    // Generate the options display
    const optionsDisplay = options.map((option, index) => `${index + 1}. ${option}`).join('\n');

    // Format deadline display if it exists
    const deadlineDisplay = deadline
      ? `\n\n**Deadline:** ${new Date(deadline).toLocaleString()}\nResults will be automatically revealed after the deadline.`
      : '';

    // Format excluded users display if any
    const excludedUsersDisplay =
      excludedUsers.length > 0 ? `\n\n**Excluded Users:** ${excludedUsers.map((id) => `<@${id}>`).join(', ')}` : '';

    // Reply with confirmation
    await interaction.reply({
      content: `# 🔮 Prediction Created: ${title}\n\n**Options:**\n${optionsDisplay}${deadlineDisplay}${excludedUsersDisplay}\n\nUsers can now vote using \`/predict\` command! The results will be hidden until revealed.`,
      ephemeral: false,
    });
  },
};
