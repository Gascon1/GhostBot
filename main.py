import discord
from discord.ext import tasks,commands
import os
from discord import app_commands
import json

from command.Die.die_command import rollAttackDice, rollDice
from util.get_user_data import get_user_data

MY_GUILD = discord.Object(id=1296556847976939571) 



class MyClient(discord.Client):
    def __init__(self, *, intents: discord.Intents):
        super().__init__(intents=intents)
        # A CommandTree is a special type that holds all the application command
        # state required to make it work. This is a separate class because it
        # allows all the extra state to be opt-in.
        # Whenever you want to work with application commands, your tree is used
        # to store and work with them.
        # Note: When using commands.Bot instead of discord.Client, the bot will
        # maintain its own tree instead.
        self.tree = app_commands.CommandTree(self)

    # In this basic example, we just synchronize the app commands to one guild.
    # Instead of specifying a guild to every command, we copy over our global commands instead.
    # By doing so, we don't have to wait up to an hour until they are shown to the end-user.
    async def setup_hook(self):
        # This copies the global commands over to your guild.
        self.tree.copy_global_to(guild=MY_GUILD)
        await self.tree.sync(guild=MY_GUILD)

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
client = MyClient(intents=intents)

@client.tree.command()
async def hello(interaction: discord.Interaction):
    """Says hello!"""
    await interaction.response.send_message(f'Hi, {interaction.user.mention}')


@client.tree.command()
@app_commands.describe(
    number_of_dice='The number of dice you want to roll',
    sides='The number of sides on each dice',
)
@commands.has_guild_permissions(change_nickname=True)
async def roll(interaction: discord.Interaction, number_of_dice: int, sides: int):
    is_user_dead = any(x.name == "Dead" for x in interaction.user.roles)
    rolls = rollDice(number_of_dice,sides,is_user_dead)
    if rolls['died'] == 1 and not any(x.name == "Dead" for x in interaction.user.roles) :
        await interaction.user.edit(nick='Ghost of '+interaction.user.nick + '👻')
        await interaction.user.remove_roles(discord.Object(id=1304609401130324066))
        await interaction.user.add_roles(discord.Object(id=1304609190676922412))
        print("should die")
    await interaction.response.send_message(f'{rolls["text"]}')

@client.tree.command()

@commands.has_guild_permissions(change_nickname=True)
async def revive(interaction: discord.Interaction, ):
    is_user_dead = any(x.name == "Dead" for x in interaction.user.roles)
    rolls = rollDice(2,6,is_user_dead)
    if rolls['revived'] == 1 and not any(x.name == "ALIVE AND THRIVING" for x in interaction.user.roles) :
        await interaction.user.edit(nick=interaction.user.nick.split("Ghost of ")[0].split['👻'][0])
        await interaction.user.remove_roles(discord.Object(id=1304609190676922412))
        await interaction.user.add_roles(discord.Object(id=1304609401130324066))
        print("should revive")
    await interaction.response.send_message(f'{rolls["text"]}')


@client.tree.command()
@app_commands.describe(
    target='The target of your attack',
)
async def attack(interaction: discord.Interaction, target: str):
    rolls = rollAttackDice(target)
    await interaction.response.send_message(f'{rolls}')


@client.tree.command()
async def status(interaction: discord.Interaction):
    is_user_dead = any(x.name == "Dead" for x in interaction.user.roles)
    user_data = await get_user_data(str(interaction.user.id))
    await interaction.response.send_message(
f"""Status : Dead :new_moon_with_face:
Exp: {user_data["exp"]}
Revival count: {user_data["revive_count"]}""") if is_user_dead else await interaction.response.send_message(
f"""Status: Alive :full_moon_with_face:
Exp: {user_data["exp"]}
Revival count: {user_data["revive_count"]}""")


@client.event
async def on_ready():
    print(f'We have logged in as {client.user}')
    #await tree.sync(guild=discord.Object(id=1296556847976939571))
    #print(f'Ready')
    #remind_to_roll.start(client.get_guild(1296556847976939571))


@tasks.loop(hours=1)
async def remind_to_roll(server: discord.Guild):
    await client.wait_until_ready()
    channel = client.get_channel(1296556852468908034)
    #role = server.get_role(1304609190676922412)
    allowed_mentions = discord.AllowedMentions.all()
    await channel.send(content="<@&1304609190676922412> TIME TO GET IT TWISTED", allowed_mentions=allowed_mentions)



client.run(os.getenv('TOKEN'))



#@remind_to_roll.before_loop
#async def before_remind_to_roll():
#    print('waiting')
#    remind_to_roll.next_iteration('1731117600')