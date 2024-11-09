import random


class Die(object):
    def __init__(self, sides=6):
        self.sides = sides

    def roll(self):
        return str(random.randint(1,self.sides))
    
    def get (self):
        return self.roll_count