# Installation

1. `git clone` the project.
2. Copy `.env.example` and remove `.example`
3. Fill the variables with your Discord Bot ID/Token from the Discord Developer Portal
4. `npm i` to install dependencies.
5. `npm run deploy-commands` to load up the available GhostBot commands
6. `npm run start` to make the bot come online

## Environment Variables

Required variables in your `.env` file:

- `DISCORD_TOKEN` - Your Discord bot token
- `CLIENT_ID` - Your Discord application client ID
- `GUILD_ID` - Your Discord server (guild) ID

Optional variables:

- `PRICE_MONITORING_CHANNEL_ID` - Channel ID for PC parts price drop notifications (if not set, will use system channel)

## Features

### PC Parts Price Monitoring

GhostBot can monitor PCPartPicker lists for price changes and notify you when prices drop!

**Commands:**
- `/price-monitor add <url> [name]` - Add a PCPartPicker list to monitor
- `/price-monitor list` - Show all monitored lists
- `/price-monitor remove <id>` - Remove a list from monitoring
- `/price-monitor check` - Manually trigger a price check (admin only)

**How it works:**
1. Add a PCPartPicker list URL using `/price-monitor add`
2. The bot checks prices every 5 minutes automatically
3. When price drops are detected, notifications are sent to your configured channel
4. Price history is tracked in the database for analysis

**Example:**
```
/price-monitor add https://ca.pcpartpicker.com/list/tyktZc My Gaming PC Build
```

