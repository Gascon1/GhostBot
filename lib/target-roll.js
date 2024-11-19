const { rollDice } = require('./dice-roll');

const equalTo = (x, y) => x === y;
const notEqualTo = (x, y) => x !== y;
const greaterThan = (x, y) => x > y;
const greaterThanOrEqual = (x, y) => x >= y;
const lessThan = (x, y) => x < y;
const lessThanOrEqual = (x, y) => x <= y;

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
