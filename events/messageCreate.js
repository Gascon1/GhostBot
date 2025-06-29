const { validateWordleEntry } = require('../lib/nyt-games/games-utils');

module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const client = message.client;
    // const helpMenu = client.helpMenu;
    // const wordle = client.wordle;
    const leMot = client.leMot;
    // const connections = client.connections;
    // const strands = client.strands;
    // const pips = client.pips;

    if (message.channel.isThread()) {
      switch (message.channel.id) {
      case '1388350108491579552':
        console.log("-- Wordle FR --");
        try {
          const userId = message.author.id;
          const lines = message.content.split('\n');
          const firstLine = lines[0]?.trim();
          if (lines.length >= 2) {
            if (firstLine.includes('Wordle')) {
              const result = validateWordleEntry("fr", firstLine, lines.splice(0, 1).join('\n')); // wordle.addEntry(userId, firstLine, content);
              await message.react(result);
            }
          }
        } catch (err) {
          console.error('Caught exception:', err);
        }
        break;
      case '1388355989786333294':
        console.log("-- Wordle EN --");
        try {
          // const userId = message.author.id;
          const lines = message.content.split('\n');
          const firstLine = lines[0]?.trim();
          if (lines.length >= 2) {
            if (firstLine.includes('Wordle')) {
              // const content = lines.slice(1).join('\n');
              const result = validateWordleEntry("en", firstLine, lines.splice(0, 1).join('\n')); // wordle.addEntry(userId, firstLine, content);
              await message.react(result);
            }
          }
        } catch (err) {
          console.error('Caught exception:', err);
        }
        break;
      }
    }
  },
};
