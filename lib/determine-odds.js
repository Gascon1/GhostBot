function determineOdds(rolls, sides) {
  return Math.pow((sides - 1) / sides, rolls);
}

module.exports = { determineOdds };
