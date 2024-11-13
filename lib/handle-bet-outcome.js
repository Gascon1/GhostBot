const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '../../save.json');

async function handleBetOutcome(winningBets) {
  let saveData;
  try {
    saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
  } catch {
    saveData = {};
  }

  for (const userId of winningBets) {
    if (!saveData[userId]) {
      saveData[userId] = {};
    }
    saveData[userId].lastReviveAttemptTime = null; // Reset revive attempt time
  }

  fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2));
}

module.exports = { handleBetOutcome };
