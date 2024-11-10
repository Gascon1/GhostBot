const AsciiTable = require('ascii-table');

/**
 * Creates an ASCII table for the dice roll results.
 * @param {number} rolls - The number of dice rolled.
 * @param {number} sides - The number of sides on the dice.
 * @param {number[]} rollResults - The results of the dice rolls.
 * @returns {string} - The formatted ASCII table as a string.
 */
function createAsciiTable(rolls, sides, rollResults) {
  const sumRolls = rollResults.reduce((sum, roll) => sum + roll, 0);
  const table = new AsciiTable(`${rolls}d${sides}`);

  table.setHeading('rolls', 'sum');
  table.addRow(rollResults.join(', '), sumRolls);

  console.log(table.toString());

  return table.toString();
}

module.exports = { createAsciiTable };
