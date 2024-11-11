

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
}

module.exports = { determineAsciiArt };
