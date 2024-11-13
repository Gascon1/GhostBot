/**
 * Creates an ASCII table for the dice roll results.
 * @param {number[]} rollResults - The results of the dice rolls.
 * @param {member} member - The member who ran the command
 * @param {string} odds - The odds of survival for the roll
 * @param {RoleManager} deadRole - The "Dead" role
 * @param {number} xp - The "Dead" role
 * @returns {{flavor:string,art:string,end:string}} - The formatted ASCII art as a string.
 */
function determineAsciiArt(rollResults, member, odds, deadRole, xp) {
  const isDead = member.roles.cache.has(deadRole.id);
  const hasRolledOne = rollResults.includes(1);

  let monster = { name: '', art: '' };
  const percentageOdds = odds * 100;
  const textOdds = (odds * 100).toFixed(3) + '%';

  if (percentageOdds > 70.0) {
    monster = {
      name: 'slime',
      art: `

                    ██████████                
            ████████░░░░░░░░░░████████        
        ██░░░░░░░░░░░░░░░░░░░░░░░░░░██      
      ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██    
    ██░░░░░░░░░░░░░░░░░░            ░░██    
    ██░░░░░░░░░░░░░░                  ░░██  
    ██░░░░░░░░░░                        ░░░░██
    ██░░░░░░░░░░                        ░░░░██
    ██░░░░░░░░░░        ██        ██      ░░██
    ██░░░░░░░░          ██        ██      ░░██
    ██░░░░░░░░          ██        ██      ░░██
    ██░░░░░░░░                            ░░██
    ██░░░░░░░░░░                          ░░██
    ██░░░░░░░░░░░░                        ░░██
    ██░░░░░░░░░░░░░░                      ░░██
    ██░░░░░░░░░░░░░░░░░░                ░░░░██
    ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████
        ██████████████████████████████████    

        
`,
    };
  }

  if (percentageOdds < 70.0 && percentageOdds > 60.0) {
    monster = {
      name: 'goblin',
      art: '\r\n        .-"""".\r\n       /       \\\r\n   __ /   .-.  .\\\r\n  /  `\\  /   \\/  \\\r\n  |  _ \\/   .==.==.\r\n  | (   \\  /____\\__\\\r\n   \\ \\      (_()(_()\r\n    \\ \\            \'---._\r\n     \\                   \\_\r\n  /\\ |`       (__)________/\r\n /  \\|     /\\___/\r\n|    \\     \\||VV\r\n|     \\     \\|"""",\r\n|      \\     ______)\r\n\\       \\  /`\r\n \\      \\  \r\n',
    };
  }

  if (percentageOdds < 60.0 && percentageOdds > 55.0) {
    monster = {
      name: 'vampire',
      art: "              __.......__\r\n            .-:::::::::::::-.\r\n          .:::''':::::::''':::.\r\n        .:::'     `:::'     `:::. \r\n   .'\\  ::'   ^^^  `:'  ^^^   '::  /`.\r\n  :   \\ ::   _.__       __._   :: /   ;\r\n :     \\`: .' ___\\     /___ `. :'/     ; \r\n:       /\\   (_|_)\\   /(_|_)   /\\       ;\r\n:      / .\\   __.' ) ( `.__   /. \\      ;\r\n:      \\ (        {   }        ) /      ; \r\n :      `-(     .  ^\"^  .     )-'      ;\r\n  `.       \\  .'<`-._.-'>'.  /       .'\r\n    `.      \\    \\;`.';/    /      .'\r\n      `._    `-._       _.-'    _.'\r\n       .'`-.__ .'`-._.-'`. __.-'`.\r\n     .'       `.         .'       `.\r\n   .'           `-.   .-'           `. \r\n",
    };
  }

  if (percentageOdds <= 55.0) {
    monster = {
      name: 'minotaur',
      art: "                   (    )\r\n                  ((((()))\r\n                  |o\\ /o)|\r\n                  ( (  _')\r\n                   (._.  /\\__\r\n                  ,\\___,/ '  ')\r\n    '.,_,,       (  .- .   .    )\r\n     \\   \\\\     ( '        )(    )\r\n      \\   \\\\    \\.  _.__ ____( .  |\r\n       \\  /\\\\   .(   .'  /\\  '.  )\r\n        \\(  \\\\.-' ( /    \\/    \\)\r\n         '  ()) _'.-|/\\/\\/\\/\\/\\|\r\n             '\\\\ .( |\\/\\/\\/\\/\\/|\r\n               '((  \\    /\\    /\r\n               ((((  '.__\\/__.')\r\n                ((,) /   ((()   )\r\n                 \"..-,  (()(\"   /\r\n                    _//.   ((() .\"\r\n          _____ //,/\" ___ ((( ', ___\r\n                           ((  )\r\n                            / /\r\n                          _/,/'\r\n                        /,/,\" \r\n",
    };
  }

  if (isDead) {
    monster = {
      name: 'ghost',
      art: "     .-.\r\n   .'   `.\r\n   :g g   :\r\n   : o    `.\r\n  :         ``.\r\n :             `.\r\n:  :         .   `.\r\n:   :          ` . `.\r\n `.. :            `. ``;\r\n    `:;             `:'\r\n       :              `.\r\n        `.              `.     .\r\n          `'`'`'`---..,___`;.-' \r\n",
    };
  }

  if (hasRolledOne) {
    if (!isDead) {
      return {
        flavor: "You've encountered a " + monster.name + ', time to fight!',
        art: monster.art,
        end: 'RUH ROH , you died :skull:' + '\r\n' + 'Odds were: ' + textOdds,
      };
    }

    return {
      flavor: "You've encountered a " + monster.name + ', time to fight!',
      art: monster.art,
      end: "Couldn't even kill it from the afterlife. What a disappointment." + '\r\n' + 'Odds were: ' + textOdds,
    };
  }

  if (isDead) {
    return {
      flavor: "You've encountered a " + monster.name + ', time to fight!',
      art: monster.art,
      end: `Congratulations, you've defeated a ghost!` + '\r\n' + 'Odds were: ' + textOdds,
    };
  } else {
    return {
      flavor: "You've encountered a " + monster.name + ', time to fight!',
      art: monster.art,
      end: `Congratulations, you've earned ${xp}XP!` + '\r\n' + 'Odds were: ' + textOdds,
    };
  }
}

module.exports = { determineAsciiArt };
