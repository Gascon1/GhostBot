const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '../../save.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list-predictions')
    .setDescription('List all active predictions or past predictions')
    .addBooleanOption((option) =>
      option
        .setName('show_past')
        .setDescription('Show past (revealed) predictions instead of active ones')
        .setRequired(false),
    ),
  async execute(interaction) {
    const showPast = interaction.options.getBoolean('show_past') || false;

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
        content: 'There are no predictions to display.',
        ephemeral: true,
      });
      return;
    }

    // Filter predictions based on the showPast option
    const filteredPredictions = saveData.predictions.filter((pred) => pred.isRevealed === showPast);

    if (filteredPredictions.length === 0) {
      await interaction.reply({
        content: showPast ? 'There are no past predictions to display.' : 'There are no active predictions to display.',
        ephemeral: true,
      });
      return;
    }

    // Sort predictions by creation date (newest first)
    filteredPredictions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Generate the list display
    const title = showPast ? '# 📜 Past Predictions' : '# 🔮 Active Predictions';

    let listDisplay = '';

    filteredPredictions.forEach((pred, index) => {
      // Calculate vote count
      const voteCount = Object.keys(pred.votes).length;

      // Format creation date
      const createdDate = new Date(pred.createdAt);
      const dateString = createdDate.toLocaleDateString();

      // Add prediction to the list
      listDisplay += `## ${index + 1}. ${pred.title}\n`;
      listDisplay += `**ID:** ${pred.id}\n`;
      listDisplay += `**Created:** ${dateString}\n`;

      // Add deadline information if it exists
      if (pred.deadline) {
        const deadlineDate = new Date(pred.deadline);
        const deadlineString = deadlineDate.toLocaleString();
        const now = new Date();
        const timeRemaining = deadlineDate - now;

        if (timeRemaining > 0 && !pred.isRevealed) {
          // Calculate days, hours, minutes remaining
          const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

          const timeRemainingString =
            days > 0
              ? `${days}d ${hours}h ${minutes}m remaining`
              : hours > 0
                ? `${hours}h ${minutes}m remaining`
                : `${minutes}m remaining`;

          listDisplay += `**Deadline:** ${deadlineString} (${timeRemainingString})\n`;
        } else {
          listDisplay += `**Deadline:** ${deadlineString} (Expired)\n`;
        }
      }

      listDisplay += `**Votes:** ${voteCount}\n`;

      // For active predictions, show the voting options
      if (!showPast) {
        listDisplay += `**Options:**\n`;
        pred.options.forEach((option, idx) => {
          listDisplay += `${idx + 1}. ${option}\n`;
        });
      }
      // For past predictions, show the results
      else {
        // Count votes for each option
        const optionVoteCounts = {};
        pred.options.forEach((_, idx) => {
          optionVoteCounts[idx] = 0;
        });

        // Count the votes
        Object.values(pred.votes).forEach((optionIndex) => {
          if (optionVoteCounts[optionIndex] !== undefined) {
            optionVoteCounts[optionIndex]++;
          }
        });

        // Show the results
        listDisplay += `**Results:**\n`;
        pred.options.forEach((option, idx) => {
          const count = optionVoteCounts[idx] || 0;
          const isWinner = pred.winners.includes(idx);
          const winnerText = isWinner ? ' 🏆 WINNER' : '';
          listDisplay += `${idx + 1}. ${option}: ${count} vote(s)${winnerText}\n`;
        });
      }

      listDisplay += '\n';
    });

    // Reply with the list
    await interaction.reply({
      content: `${title}\n\n${listDisplay}`,
      ephemeral: false,
    });
  },
};
