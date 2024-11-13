const fs = require('fs');
const path = require('path');

/**
 * Updates the revive count for the user in the save.json file.
 * @param {string} userId - The ID of the user.
 */
function updateReviveAttempts(userId) {
  const filePath = path.join(__dirname, '../save.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const userData = data[userId];

  if (userData) {
    // Increment the revive count
    userData.reviveAttempts += 1;

    // Write the updated data back to the save.json file
    data[userId] = userData;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`Revive count updated for user ${userId}: ${userData.reviveAttempts}`);
  } else {
    console.log(`User data not found for user ${userId}`);
  }
}

function resetReviveAttempts(userId) {
  const filePath = path.join(__dirname, '../save.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const userData = data[userId];

  if (userData) {
    // Reset the revive count
    userData.reviveAttempts = 0;

    // Write the updated data back to the save.json file
    data[userId] = userData;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`Revive count reset for user ${userId}`);
  } else {
    console.log(`User data not found for user ${userId}`);
  }
}

function awardXp(userId, xp) {
  const filePath = path.join(__dirname, '../save.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const userData = data[userId];

  if (userData) {
    // Increment the XP
    userData.xp += xp;

    // Write the updated data back to the save.json file
    data[userId] = userData;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`XP awarded to user ${userId}: ${xp}`);
  } else {
    console.log(`User data not found for user ${userId}`);
  }
}

function resetXp(userId) {
  const filePath = path.join(__dirname, '../save.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const userData = data[userId];

  if (userData) {
    // Reset the XP
    userData.xp = 0;

    // Write the updated data back to the save.json file
    data[userId] = userData;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`XP reset for user ${userId}`);
  } else {
    console.log(`User data not found for user ${userId}`);
  }
}

/**
 * Updates the user's role and nickname based on the dice roll results.
 * @param {import('discord.js').GuildMember} member - The member to update.
 * @param {number[]} rollResults - The results of the dice rolls.
 * @param {import('discord.js').Role} deadRole - The "Dead" role.
 * @param {number} xp - The XP to award.
 */
async function updateUserRoleAndNickname(member, rollResults, deadRole, xp) {
  const hasRolledOne = rollResults.includes(1);
  const hasQuadTwo = rollResults.filter((roll) => roll === 2).length >= 4;

  const isDead = member.roles.cache.has(deadRole.id);

  if (isDead && !hasQuadTwo) {
    updateReviveAttempts(member.user.id);
  }

  if (hasRolledOne) {
    if (deadRole && !member.roles.cache.has(deadRole.id)) {
      resetReviveAttempts(member.user.id);
      resetXp(member.user.id);

      await member.roles.add(deadRole);

      const newNickname = `Ghost of ${member.nickname} 👻`;
      await member.setNickname(newNickname);

      console.log(`Role ${deadRole.name} added to ${member.user.tag} and nickname changed to ${newNickname}`);
    }
  } else if (hasQuadTwo && member.roles.cache.has(deadRole.id)) {
    await member.roles.remove(deadRole);

    const originalNickname = member.displayName.replace(/^Ghost of /, '').replace(/ 👻$/, '');
    await member.setNickname(originalNickname);

    console.log(`Role ${deadRole.name} removed from ${member.user.tag} and nickname restored to ${originalNickname}`);
  } else {
    console.log('xp to award', xp);

    if (!isDead && xp) {
      awardXp(member.user.id, xp);
    }

    console.log('No role change required');
  }
}

module.exports = { updateUserRoleAndNickname };
