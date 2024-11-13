function determineOdds(rolls, sides) {
  return Math.pow((sides - 1) / sides, rolls);
}

function determinePerfectRollOdds(rolls, sides) {
  return Math.pow(1 / sides, rolls);
}

module.exports = { determineOdds, determinePerfectRollOdds };
