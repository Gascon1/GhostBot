const Games = {
  "Costcodle": 1,
  "Sudoku": 2,
  "Connections": 3,
  "Mini": 4,
  "Pips": 5,
  "WordleEN": 6,
  "Strands": 7,
  "WordleFR": 8,
  "Tiles": 9,
};

function getGameFromChannel(message) {
  const channel_name = message.channel.name.lower();
  return Games[channel_name];
}

function isWordleENSubmission(lines) {
  return lines.match('^Wordle (\\d+|\\d{1,3}(,\\d{3})*)( 🎉)? (\\d|X)\\/\\d$');
}

function isConnectionsSubmission(lines) {
  return lines.match('^Connections *(\n)Puzzle #\\d+');
}

function isStrandsSubmission(lines) {
  return lines.match('Strands #\\d+');
}

function isCostcodleSubmission(lines) {
  return lines.match('Costcodle #\\d+');
}

function isPipsSubmission(lines) {
  return lines.match('Pips #\\d+');
}

module.exports = { Games, getGameFromChannel, isWordleENSubmission, isConnectionsSubmission, isStrandsSubmission, isCostcodleSubmission, isPipsSubmission };
