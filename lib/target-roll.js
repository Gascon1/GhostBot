const { rollDice } = require('./dice-roll');

const equalTo = (x, y) => x === y;
const notEqualTo = (x, y) => x !== y;
const greaterThan = (x, y) => x > y;
const greaterThanOrEqual = (x, y) => x >= y;
const lessThan = (x, y) => x < y;
const lessThanOrEqual = (x, y) => x <= y;

/**
 * Creates an ASCII table for the dice roll results.
 * @param {number} numberOfDice - The number of dice rolled.
 * @param {number} numberOfSides - The number of sides on the dice.
 * @param {number} target - The number against which the comparator will evaluate your rolls.
 * @param {function} comparator - One of the six functions defined in this file, used to determine whether the condition is met or not
 * @param {boolean} everyDiceMeetsCondition - If true, EVERY dice needs to meet the comparator condition, if not, only one of them needs to be true to pass.
 * @returns {{values: number[], conditionMet: boolean}} - An object containing the values for all the rolls being made, and a boolean which shows if the comparator's condition passed
 */
function targetRoll(numberOfDice, numberOfSides, target, comparator, everyDiceMeetsCondition) {
  const results = rollDice(numberOfDice, numberOfSides);
  return {
    values: results,
    conditionMet: everyDiceMeetsCondition
      ? results.every((roll) => comparator(roll, target))
      : results.some((roll) => comparator(roll, target)),
  };
}

module.exports = { targetRoll, equalTo, notEqualTo, greaterThan, greaterThanOrEqual, lessThan, lessThanOrEqual };
