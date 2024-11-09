from model.Die.die import Die
from tabulate import tabulate
from prettytable import PrettyTable, _DEPRECATED_DOUBLE_BORDER



def rollDice(rolls, sides):
    table = PrettyTable()
    table.title = str(rolls)+'d'+str(sides)
    roll_results = []
    d1 = Die(sides)
    count = 0
    rolls_to_print = ""
    sum_rolls = 0
    dead = False
    while count < rolls:
        single_roll = d1.roll()
        if single_roll == '1':
            dead = True
        if(count + 1 == rolls):
            rolls_to_print += single_roll
        else:
            rolls_to_print += single_roll + ', '   
        sum_rolls += int(single_roll)
        count+=1
    roll_results.append(rolls_to_print)
    table.add_column("rolls",roll_results)
    table.add_column('sum',[sum_rolls])
    table.set_style(_DEPRECATED_DOUBLE_BORDER)
    if dead:
        return  '```' + 'You\'ve encountered a slime, time to fight!' + """ 
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
""" + table.get_string() + '```' + 'RUH ROH , you died :skull:'
    return '```' + 'You\'ve encountered a slime, time to fight!' + """

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
""" + table.get_string() + '```'

#tabulate(roll_results, headers=[str(rolls)+'d'+str(sides)], tablefmt="heavy_outline", stralign="center")
    