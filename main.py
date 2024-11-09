import discord
import random
from discord.ext import tasks,commands
import os
from prettytable import PrettyTable


class Die(object):
    def __init__(self, sides=6):
        self.sides = sides

    def roll(self):
        return random.randint(1,self.sides)
    
    def get (self):
        return self.roll_count
    

def rollDice(rolls, sides):
    roll_results = []
    d1 = Die(sides)
    count = 0
    while count <=rolls:
        roll_results.append(d1.roll())
        count+=1
    return roll_results
    


intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot("!",intents=intents)

@bot.command()
async def test(ctx, arg):
    await ctx.send(arg)

@bot.event
async def on_ready():
    print(f'We have logged in as {bot.user}')
    print(bot.all_commands)
    #remind_to_roll.start(bot.get_guild(1296556847976939571))

@bot.event
async def on_message(message):
    print(message.content)
    if message.author == bot.user:
        return

    if message.content.startswith('$hello'):
        await message.channel.send('Hello!')

@tasks.loop(hours=1)
async def remind_to_roll(server: discord.Guild):
    await bot.wait_until_ready()
    channel = bot.get_channel(1296556852468908034)
    #role = server.get_role(1304609190676922412)
    allowed_mentions = discord.AllowedMentions.all()
    await channel.send(content="<@&1304609190676922412> TIME TO GET IT TWISTED", allowed_mentions=allowed_mentions)



bot.run(os.getenv('TOKEN'))



#@remind_to_roll.before_loop
#async def before_remind_to_roll():
#    print('waiting')
#    remind_to_roll.next_iteration('1731117600')