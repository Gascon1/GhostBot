from model.Die.die import Die
from prettytable import PrettyTable, _DEPRECATED_DOUBLE_BORDER


def rollAttackDice(target: str):
    table = PrettyTable()
    table.title = str(1)+'d'+str(6)
    survived = ""
    d1 = Die(6)
    single_roll = d1.roll()
    if single_roll != "6":
        survived = """
        AH! This but a flesh wound :smirk:"""
    table.add_column("rolls",single_roll)
    table.add_column('sum',[single_roll])
    table.set_style(_DEPRECATED_DOUBLE_BORDER)
    return f' EN GARDE FILTHY ANIMAL, I STRIKE THEE {target} ! :crossed_swords: ' + """

```""" + table.get_string() + '```'  + survived


def rollDice(rolls, sides, is_user_dead):
    table = PrettyTable()
    table.title = str(rolls)+'d'+str(sides)
    roll_results = []
    d1 = Die(sides)
    count = 0
    rolls_to_print = ""
    sum_rolls = 0
    last_roll = ""
    dying = False
    reviving = False
    reroll = False
    if not is_user_dead:
        while count < rolls:
            single_roll = d1.roll()
            if single_roll == '1':
                dying = True
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
        if dying:
            return  {"text":'```' + 'You\'ve encountered a slime, time to fight!' + """ 
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
    """ + """ 
""" + table.get_string() + '```' + 'RUH ROH , you died :skull:', "died": 1, "revived":0 }
        return {"text":'```' + 'You\'ve encountered a slime, time to fight!' + """

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
           
        """ + """ 
""" + table.get_string() + '```', "died":0, "revived":0}
    while count < rolls:
        single_roll = d1.roll()
        if (single_roll == last_roll and single_roll == "6"):
            reviving = True
        if (single_roll == last_roll and single_roll != "6" and single_roll != "1"):
            reroll = True
        if(count + 1 == rolls):
            rolls_to_print += single_roll
        else:
            rolls_to_print += single_roll + ', '   
        sum_rolls += int(single_roll)
        last_roll = single_roll
        count+=1
    roll_results.append(rolls_to_print)
    table.add_column("rolls",roll_results)
    table.add_column('sum',[sum_rolls])
    table.set_style(_DEPRECATED_DOUBLE_BORDER)
    if reroll and rolls == 2 and sides == 6:
        return {"text":'```' + 'You\'ve traveled far mighty one, don\'t give up, one more roll for glory!' + """



 _______        _____ ____ _____ _____ ____  
|_   _\ \      / /_ _/ ___|_   _| ____|  _ \ 
  | |  \ \ /\ / / | |\___ \ | | |  _| | | | |
  | |   \ V  V /  | | ___) || | | |___| |_| |
  |_|    \_/\_/  |___|____/ |_| |_____|____/ 


 
    """ + """ 
""" + table.get_string() + '```',"died":0,"revived":0}
    if reviving and rolls == 2 and sides == 6:
        return {"text":'```' + 'The fight isn\'t over warrior, may your new life be fruitful, RISE!' + """
     .-.
   __| |__
  [__   __]
     | |
     | |
     | |
     '-'

        """ + """ 
"""  + table.get_string() + '```',"died":0,"revived":1}
    if rolls == 2 and sides == 6:
        return {"text":'```' + 'This wasn\'t your time,  keep going warrior!' + """
         _   _  ___  ____  _____ 
        | | | |/ _ \|  _ \| ____|
        | |_| | | | | |_) |  _|  
        |  _  | |_| |  __/| |___ 
        |_| |_|\___/|_|   |_____|
            
          """ + """ 
""" + table.get_string() + '```',"died":0,"revived":0}
    
    return {"text":'```' + 'You\'re tempting fate, go get her!' + """


     _____ _  _____ _____ 
    |  ___/ \|_   _| ____|
    | |_ / _ \ | | |  _|  
    |  _/ ___ \| | | |___ 
    |_|/_/   \_\_| |_____|


            """ + """ 
""" + table.get_string() + '```',"died":0,"revived":0}
    


#tabulate(roll_results, headers=[str(rolls)+'d'+str(sides)], tablefmt="heavy_outline", stralign="center")
    