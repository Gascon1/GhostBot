const { Events } = require('discord.js');
const { Games, getGameFromChannel, isWordleENSubmission, isConnectionsSubmission, isStrandsSubmission, isPipsSubmission } = require('../lib/nyt-games/games-utils');

module.exports = (client) => {
  const helpMenu = client.helpMenu;
  const wordle = client.wordle;
  const leMot = client.leMot;
  const connections = client.connections;
  const strands = client.strands;
  const pips = client.pips;

  function buildHelpMenu() {
    helpMenu.add('ranks', {
      explanation: "View the leaderboard over time or for a specific puzzle.",
      usage: "`?ranks (today|weekly|10-day|all-time)`\n`?ranks <MM/DD/YYYY>`\n`?ranks <puzzle #>`",
      notes: "- `?ranks` will default to `?ranks weekly`.\n- When using MM/DD/YYYY format, the date must be a Sunday.",
    });
    helpMenu.add('missing', {
      explanation: "View and mention all players who have not yet submitted a puzzle.",
      usage: "`?missing [<puzzle #>]`",
      notes: "`?missing` will default to today's puzzle.",
    });
    helpMenu.add('entries', {
      explanation: "View a list of all submitted entries for a player.",
      usage: "`?entries [<player>]`",
    });
    helpMenu.add('stats', {
      explanation: "View more detailed stats on one or more players.",
      usage: "`?stats <player1> [<player2> ...]`",
      notes: "`?stats` will default to just query for the calling user.",
    });
    helpMenu.add('view', {
      explanation: "View specific details of one or more entries.",
      usage: "`?view [<player>] <puzzle #1> [<puzzle #2> ...]`",
    });
    helpMenu.add('add', {
      explanation: "Manually add an entry to the database.",
      usage: "`?add [<player>] <entry>`",
      ownerOnly: true,
    });
    helpMenu.add('remove', {
      explanation: "Remove an entry from the database.",
      usage: "`?remove [<player>] <puzzle #>`",
      ownerOnly: true,
    });
  }

  // Initial setup
  buildHelpMenu();

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || message.guild === null) return;

    try {
      const userId = message.author.id;
      const lines = message.content.split('\n');
      const firstLine = lines[0]?.trim();
      const firstTwoLines = lines.slice(0, 2).join('\n');

      if (lines.length >= 2) {
        switch (firstLine) {
        case firstLine.includes('Wordle'): {
          const content = lines.slice(1).join('\n');
          const result = isWordleENSubmission(firstLine) ? wordle.addEntry(userId, firstLine, content) : leMot.addEntry(userId, firstLine, content);
          await message.react(result ? '✅' : '❌');
          break;
        }
        case firstLine.includes('Connections') && isConnectionsSubmission(firstTwoLines):{
          const content = lines.slice(2).join('\n');
          const result = connections.addEntry(userId, firstTwoLines, content);
          await message.react(result ? '✅' : '❌');
          break;
        }
        case firstLine.includes('Strands') && isStrandsSubmission(firstTwoLines):{
          const content = lines.slice(2).join('\n');
          const result = strands.addEntry(userId, firstTwoLines, content);
          await message.react(result ? '✅' : '❌');
          break;
        }
        case firstLine.includes('Pips') && isPipsSubmission(firstTwoLines):{
          const content = lines.slice(2).join('\n');
          const result = pips.addEntry(userId, firstTwoLines, content);
          await message.react(result ? '✅' : '❌');
          break;
        }
        }
      }
    } catch (err) {
      console.error('Caught exception:', err);
    }
  });

  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const args = interaction.options.data.map(opt => opt.value);
    const command = interaction.commandName;
    const game = getGameFromChannel(interaction.channel);

    try {
      switch (command) {
      case 'help':
        if (args.length === 0) {
          await interaction.reply(helpMenu.getAll());
        } else if (args.length === 1) {
          await interaction.reply(helpMenu.getMessage(args[0]));
        } else {
          await interaction.reply("Couldn't understand command. Try `/help <command>`.");
        }
        break;

      case 'ranks':
        await handleGameCommand(game, 'getRanks', interaction, args);
        break;
      case 'missing':
        await handleGameCommand(game, 'getMissing', interaction, args);
        break;
      case 'entries':
        await handleGameCommand(game, 'getEntries', interaction, args);
        break;
      case 'view':
        await handleGameCommand(game, 'getEntry', interaction, args);
        break;
      case 'stats':
        await handleGameCommand(game, 'getStats', interaction, args);
        break;
      }
    } catch (err) {
      console.error('Caught exception:', err);
    }
  });

  async function handleGameCommand(game, method, interaction, args) {
    const target = {
      [Games.Connections]: connections,
      [Games.Strands]: strands,
      [Games.WordleEN]: wordle,
      [Games.WordleFR]: leMot,
    }[game];

    if (target && typeof target[method] === 'function') {
      await target[method](interaction, ...args);
    } else {
      await interaction.reply("This command is not available in this channel.");
    }
  }
};