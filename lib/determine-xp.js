const logBase = (b, n) => Math.log(n) / Math.log(b);

function determineXp(oddsOfSurvival) {
  return Math.round(logBase(0.99, oddsOfSurvival));
}

module.exports = { determineXp };
