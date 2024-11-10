function rollDice(rolls, sides) {
  const rollResults = [];

  for (let i = 0; i < rolls; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rollResults.push(roll);
  }

  return rollResults;
}

module.exports = { rollDice };
