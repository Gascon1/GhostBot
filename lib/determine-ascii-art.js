const { determineOdds } = require("./determine-odds");


/**
 * Creates an ASCII table for the dice roll results.
 * @param {number[]} rollResults - The results of the dice rolls.
 * @param {member} member - The member who ran the command
 * @param {string} odds - The odds of survival for the roll
 * @param {RoleManager} deadRole - The "Dead" role
 * @returns {string} - The formatted ASCII art as a string.
 */
function determineAsciiArt(rollResults, member, odds, deadRole) {
    const isDead = member.roles.cache.has(deadRole.id);
    const hasRolledOne = rollResults.includes(1);
    const hasQuadTwo = rollResults.filter((roll) => roll === 2).length >= 4;
    let monster = { "name": "", "art": "" }
    if (Number.parseFloat(odds.substring(0, odds.length - 1)) > 70.00) {
        monster = {
            "name": "slime", "art": `

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

        
`}
    }
    if (Number.parseFloat(odds.substring(0, odds.length - 1)) < 70.00 && (Number.parseFloat(odds.substring(0, odds.length - 1)) > 60.00)) {
        monster = { "name": "goblin", "art": "\r\n        .-\"\"\"\".\r\n       \/       \\\r\n   __ \/   .-.  .\\\r\n  \/  `\\  \/   \\\/  \\\r\n  |  _ \\\/   .==.==.\r\n  | (   \\  \/____\\__\\\r\n   \\ \\      (_()(_()\r\n    \\ \\            \'---._\r\n     \\                   \\_\r\n  \/\\ |`       (__)________\/\r\n \/  \\|     \/\\___\/\r\n|    \\     \\||VV\r\n|     \\     \\|\"\"\"\",\r\n|      \\     ______)\r\n\\       \\  \/`\r\n \\      \\  \r\n" }
    }
    if (Number.parseFloat(odds.substring(0, odds.length - 1)) < 60.00 && (Number.parseFloat(odds.substring(0, odds.length - 1)) > 55.00)) {
        monster = { "name": "vampire", "art": "              __.......__\r\n            .-:::::::::::::-.\r\n          .:::\'\'\':::::::\'\'\':::.\r\n        .:::\'     `:::\'     `:::. \r\n   .\'\\  ::\'   ^^^  `:\'  ^^^   \'::  \/`.\r\n  :   \\ ::   _.__       __._   :: \/   ;\r\n :     \\`: .\' ___\\     \/___ `. :\'\/     ; \r\n:       \/\\   (_|_)\\   \/(_|_)   \/\\       ;\r\n:      \/ .\\   __.\' ) ( `.__   \/. \\      ;\r\n:      \\ (        {   }        ) \/      ; \r\n :      `-(     .  ^\"^  .     )-\'      ;\r\n  `.       \\  .\'<`-._.-\'>\'.  \/       .\'\r\n    `.      \\    \\;`.\';\/    \/      .\'\r\n      `._    `-._       _.-\'    _.\'\r\n       .\'`-.__ .\'`-._.-\'`. __.-\'`.\r\n     .\'       `.         .\'       `.\r\n   .\'           `-.   .-\'           `. \r\n" }
    }
    if (Number.parseFloat(odds.substring(0, odds.length - 1)) <= 55.00) {
        monster = { "name": "minotaur", "art": "                   (    )\r\n                  ((((()))\r\n                  |o\\ \/o)|\r\n                  ( (  _\')\r\n                   (._.  \/\\__\r\n                  ,\\___,\/ \'  \')\r\n    \'.,_,,       (  .- .   .    )\r\n     \\   \\\\     ( \'        )(    )\r\n      \\   \\\\    \\.  _.__ ____( .  |\r\n       \\  \/\\\\   .(   .\'  \/\\  \'.  )\r\n        \\(  \\\\.-\' ( \/    \\\/    \\)\r\n         \'  ()) _\'.-|\/\\\/\\\/\\\/\\\/\\|\r\n             \'\\\\ .( |\\\/\\\/\\\/\\\/\\\/|\r\n               \'((  \\    \/\\    \/\r\n               ((((  \'.__\\\/__.\')\r\n                ((,) \/   ((()   )\r\n                 \"..-,  (()(\"   \/\r\n                    _\/\/.   ((() .\"\r\n          _____ \/\/,\/\" ___ ((( \', ___\r\n                           ((  )\r\n                            \/ \/\r\n                          _\/,\/\'\r\n                        \/,\/,\" \r\n" }
    }
    if (!isDead) {
        if (hasRolledOne) {
            return 'You\'ve encountered a ' + monster.name + ' , time to fight!' + monster.art + 'RUH ROH , you died :skull:' + '\r\n' + 'Odds were: ' + odds
        }
        return 'You\'ve encountered a ' + monster.name + ' , time to fight!' + monster.art + 'Congratulation , you\'ve vanquished your foe!' + '\r\n' + 'Odds were: ' + odds
    }
}



module.exports = { determineAsciiArt };
