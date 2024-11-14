const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '../save.json');

// Schedule the task to run every 5 minutes
const grantFightKingAttemptsTask = cron.schedule('*/5 * * * *', async () => {
  // Load save data
  let saveData;
  try {
    saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
  } catch {
    saveData = {};
  }

  Object.keys(saveData).forEach((key) => {
    if (saveData[key].remainingFightAttempts < 3) {
      saveData[key].remainingFightAttempts += 1;
    }
  });

  fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2), 'utf8');

  console.log('Scheduled task completed.');
});

module.exports = { grantFightKingAttemptsTask };
