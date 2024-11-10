const fs = require('fs');
const path = require('path');

/**
 * Updates the revive count for the user in the save.json file.
 * @param {string} userId - The ID of the user.
 */
function updateReviveCount(userId) {
  const filePath = path.join(__dirname, '../save.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const user_data = data[userId];

  if (user_data) {
    // Increment the revive count
    user_data.revive_count += 1;

    // Write the updated data back to the save.json file
    data[userId] = user_data;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`Revive count updated for user ${userId}: ${user_data.revive_count}`);
  } else {
    console.log(`User data not found for user ${userId}`);
  }
}

function resetReviveCount(userId) {
  const filePath = path.join(__dirname, '../save.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const user_data = data[userId];

  if (user_data) {
    // Reset the revive count
    user_data.revive_count = 0;

    // Write the updated data back to the save.json file
    data[userId] = user_data;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`Revive count reset for user ${userId}`);
  } else {
    console.log(`User data not found for user ${userId}`);
  }
}

/**
 * Updates the user's role and nickname based on the dice roll results.
 * @param {import('discord.js').GuildMember} member - The member to update.
 * @param {number[]} rollResults - The results of the dice rolls.
 * @param {import('discord.js').Role} deadRole - The "Dead" role.
 */
async function updateUserRoleAndNickname(member, rollResults, deadRole) {
  const hasRolledOne = rollResults.includes(1);
  const hasQuadTwo = rollResults.filter((roll) => roll === 2).length >= 4;

  const isDead = member.roles.cache.has(deadRole.id);

  if (isDead && !hasQuadTwo) {
    updateReviveCount(member.user.id);
  }

  if (hasRolledOne) {
    if (deadRole && !member.roles.cache.has(deadRole.id)) {
      await member.roles.add(deadRole);
      const newNickname = `Ghost of ${member.nickname} 👻`;
      await member.setNickname(newNickname);
      console.log(`Role ${deadRole.name} added to ${member.user.tag} and nickname changed to ${newNickname}`);
    }
  } else if (hasQuadTwo && member.roles.cache.has(deadRole.id)) {
    resetReviveCount(member.user.id);
    await member.roles.remove(deadRole);
    const originalNickname = member.displayName.replace(/^Ghost of /, '').replace(/ 👻$/, '');
    await member.setNickname(originalNickname);
    console.log(`Role ${deadRole.name} removed from ${member.user.tag} and nickname restored to ${originalNickname}`);
  } else {
    console.log('No role change required');
  }
}

module.exports = { updateUserRoleAndNickname };
