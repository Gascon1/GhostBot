const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');

const saveFilePath = path.join(__dirname, '../save.json');

// Create a client instance for sending messages
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// This function counts the votes and generates the results display
function generateResultsDisplay(prediction) {
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

  // Generate the results text
  const resultsDisplay = prediction.options
    .map((option, index) => {
      const count = voteCount[index] || 0;
      return `${index + 1}. ${option}: ${count} vote(s)`;
    })
    .join('\n');

  // Get total votes
  const totalVotes = Object.keys(prediction.votes).length;

  return {
    resultsDisplay,
    totalVotes,
    voteCount,
  };
}

// Schedule the task to run every minute to check for expired predictions
const revealExpiredPredictionsTask = cron.schedule('* * * * *', async () => {
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
    const { resultsDisplay, totalVotes } = generateResultsDisplay(prediction);

    // Send the reveal message
    try {
      await announceChannel.send({
        content: `# 🔮 Prediction Results (Auto-Reveal): ${prediction.title}\n\n${resultsDisplay}\n\n*Total Votes: ${totalVotes}*\n\n*This prediction has been automatically revealed because it reached its deadline.*`,
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

// Function to initialize the client
async function initialize() {
  try {
    await client.login(process.env.DISCORD_TOKEN);
    console.log('Bot logged in for auto-reveal task');
  } catch (error) {
    console.error('Error logging in:', error);
  }
}

// Initialize on module load
initialize();

module.exports = { revealExpiredPredictionsTask };
