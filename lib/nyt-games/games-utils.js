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

function validateWordleEntry(language, firstLine, puzzle) {
  const regex = language == "en" ? /\d{1,3}(,\d{3})*/ : /(#\d+)/;
  const scoreRegex = /(\d)\/(\d)/;
  const matchResult = firstLine.match(regex);
  if (!matchResult) return false;
  const puzzleId = language == "en" ? matchResult[0].replace(',', '') : matchResult[0].replace(',', '').split("#")[1] ;
  let score = 0;
  console.log(`-- Validating ${firstLine} --`);
  if (firstLine.includes('X/6') || firstLine.includes('💀/6')) {
    console.log("-- Failure --");
    score = 7;
  } else {
    console.log("-- Success --");
    score = firstLine.match(scoreRegex)[1];
  }
  const totalGreens = (puzzle.match(new RegExp('🟩', "g")) || []).length;
  const totalYellows = (puzzle.match(new RegExp('🟨', "g")) || []).length;
  const totalOthers = (puzzle.match(new RegExp('⬜', "g")) || []).length + (puzzle.match(new RegExp('⬛', "g")) || []).length;
  console.log(score);
  console.log(puzzleId);
  const result = { "id": puzzleId, "score": score, "totalGreens": totalGreens, "totalYellows": totalYellows, "totalOthers": totalOthers };
  return score == 7 ? '❌' : '✅';

}

function validateStrandsEntry(language, firstLine, puzzle) {
  const puzzleId = Array.from(firstLine.matchAll(/[\d,]+/));
  const hintsCount = (puzzle.match(new RegExp('💡', "g")) || []).length;
  console.log(puzzleId);
  const result = { "id": puzzleId, "score": score, "totalGreens": totalGreens, "totalYellows": totalYellows, "totalOthers": totalOthers };
  return '✅';

}

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

module.exports = { Games, getGameFromChannel, validateWordleEntry, isWordleENSubmission, isConnectionsSubmission, isStrandsSubmission, isCostcodleSubmission, isPipsSubmission };
