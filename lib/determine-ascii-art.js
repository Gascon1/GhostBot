

/**
 * Creates an ASCII table for the dice roll results.
 * @param {number[]} rollResults - The results of the dice rolls.
 * @returns {string} - The formatted ASCII art as a string.
 */
function determineAsciiArt(rollResults, member, deadRole) {
    const isDead = member.roles.cache.has(deadRole.id);
    const hasRolledOne = rollResults.includes(1);
    const hasQuadTwo = rollResults.filter((roll) => roll === 2).length >= 4;

    if (!isDead) {
        if (hasRolledOne) {
            return 'You\'ve encountered a slime, time to fight!' + `

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

        
` + 'RUH ROH , you died :skull:'
        }
        return 'You\'ve encountered a slime, time to fight!' + `

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

        
` + 'Congratulation , you\'ve vanquished your foe!'
    }

    if (isDead) {
        if (hasQuadTwo) {
            return 'The fight isn\'t over warrior, may your new life be fruitful, RISE!' +
                `

            .-.
          __| |__
         [__   __]
            | |
            | |
            | |
            '-'
            
            `
        }
        return 'This wasn\'t your time,  keep going warrior!' +
            `

         _   _  ___  ____  _____ 
        | | | |/ _ \\|  _ \\| ____|
        | |_| | | | | |_) |  _|  
        |  _  | |_| |  __/| |___ 
        |_| |_|\\___/|_|   |_____|
            

        `

    }
}

module.exports = { determineAsciiArt };
