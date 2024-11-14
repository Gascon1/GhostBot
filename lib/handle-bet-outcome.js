const fs = require('fs');
const path = require('path');

const saveFilePath = path.join(__dirname, '../save.json');

console.log(saveFilePath);

function handleBetOutcome(winningBets) {
  console.log(winningBets);

  let saveData;
  try {
    saveData = JSON.parse(fs.readFileSync(saveFilePath, 'utf8'));
  } catch {
    saveData = {};
  }

  console.log(saveData);

  for (const userId of winningBets) {
    console.log('are we finding the user id?', userId);

    if (!saveData[userId]) {
      saveData[userId] = {};
    }
    saveData[userId].lastReviveAttemptTime = null; // Reset revive attempt time
  }

  fs.writeFileSync(saveFilePath, JSON.stringify(saveData, null, 2));
}

module.exports = { handleBetOutcome };
