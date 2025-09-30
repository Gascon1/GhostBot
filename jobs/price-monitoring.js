const cron = require('node-cron');
const PriceMonitoringService = require('../lib/services/price-monitoring-service');

/**
 * Create a scheduled task for price monitoring
 * @param {Client} client - Discord client instance
 * @returns {Object} - Cron task object
 */
function createPriceMonitoringTask(client) {
  const priceMonitoringService = new PriceMonitoringService();

  // Schedule the task to run every 5 minutes
  return cron.schedule('*/5 * * * *', async () => {
    // Skip if the client is not ready yet
    if (!client.isReady()) {
      console.log('Discord client not ready, skipping price monitoring');
      return;
    }

    console.log('Starting price monitoring check...');

    try {
      // Check for price changes
      const result = await priceMonitoringService.checkPriceChanges();

      if (!result.success) {
        console.error('Price monitoring failed:', result.error);
        return;
      }

      console.log(
        `Price monitoring completed: ${result.listsChecked} lists checked, ${result.totalChanges} changes found`,
      );

      // If there are price changes, send notifications
      if (result.priceChanges.length > 0) {
        await sendPriceChangeNotifications(client, result.priceChanges);
      }
    } catch (error) {
      console.error('Error in price monitoring task:', error);
    }
  });
}

/**
 * Send price change notifications to Discord
 * @param {Client} client - Discord client instance
 * @param {Array} priceChanges - Array of price change data
 */
async function sendPriceChangeNotifications(client, priceChanges) {
  try {
    // Get guild and price monitoring channel
    const guildId = process.env.GUILD_ID;
    const priceChannelId = process.env.PRICE_MONITORING_CHANNEL_ID;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      console.error('Could not find guild for price notifications');
      return;
    }

    // Find the price monitoring channel
    let priceChannel = null;
    if (priceChannelId) {
      priceChannel = guild.channels.cache.get(priceChannelId);
    }

    // If no specific channel is configured, use system channel or first available text channel
    if (!priceChannel) {
      priceChannel =
        guild.systemChannel ||
        guild.channels.cache.find((ch) => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages'));
    }

    if (!priceChannel) {
      console.error('Could not find a suitable channel for price notifications');
      return;
    }

    // Send notifications for each list with changes
    for (const listData of priceChanges) {
      await sendListPriceNotification(priceChannel, listData);
    }
  } catch (error) {
    console.error('Error sending price change notifications:', error);
  }
}

/**
 * Send price notification for a specific list
 * @param {TextChannel} channel - Discord channel to send to
 * @param {Object} listData - List data with price changes
 */
async function sendListPriceNotification(channel, listData) {
  try {
    const { listName, changes } = listData;

    // Separate price drops and increases
    const priceDrops = changes.filter((change) => change.isDecrease);
    const priceIncreases = changes.filter((change) => !change.isDecrease);

    // Create embed fields for price drops (priority)
    const dropFields = priceDrops.map((change) => ({
      name: `🔽 ${change.partName}`,
      value:
        `**${change.partType}**\n` +
        `~~$${change.oldPrice.toFixed(2)}~~ → **$${change.newPrice.toFixed(2)}**\n` +
        `💰 Save $${Math.abs(change.priceDifference).toFixed(2)} (${Math.abs(change.percentChange)}%)\n` +
        `🏪 ${change.merchant}\n` +
        `🔗 [View Product](${change.partUrl || 'https://pcpartpicker.com'})`,
      inline: true,
    }));

    // Create embed fields for price increases
    const increaseFields = priceIncreases.map((change) => ({
      name: `🔼 ${change.partName}`,
      value:
        `**${change.partType}**\n` +
        `$${change.oldPrice.toFixed(2)} → **$${change.newPrice.toFixed(2)}**\n` +
        `📈 +$${change.priceDifference.toFixed(2)} (+${change.percentChange}%)\n` +
        `🏪 ${change.merchant}\n` +
        `🔗 [View Product](${change.partUrl || 'https://pcpartpicker.com'})`,
      inline: true,
    }));

    // Send price drops notification (if any)
    if (priceDrops.length > 0) {
      const totalSavings = priceDrops.reduce((sum, change) => sum + Math.abs(change.priceDifference), 0);

      // Create quick links summary
      const quickLinks = priceDrops
        .slice(0, 10) // Limit to 10 items to avoid message being too long
        .map(
          (change, index) =>
            `${index + 1}. [${change.partName.substring(0, 30)}...](${change.partUrl || 'https://pcpartpicker.com'}) - **Save $${Math.abs(change.priceDifference).toFixed(2)}**`,
        )
        .join('\n');

      const embed = {
        title: '🎉 Price Drops Detected!',
        description: `**${listName}**\n\nFound ${priceDrops.length} price drop${priceDrops.length !== 1 ? 's' : ''} with total potential savings of **$${totalSavings.toFixed(2)}**!`,
        color: 0x00ff00, // Green color for price drops
        fields: dropFields.slice(0, 20), // Leave room for quick links field
        timestamp: new Date().toISOString(),
        footer: {
          text: 'PC Parts Price Monitor',
        },
      };

      // Add quick links field if we have price drops
      if (quickLinks) {
        embed.fields.push({
          name: '🛒 Quick Purchase Links',
          value: quickLinks + (priceDrops.length > 10 ? `\n... and ${priceDrops.length - 10} more deals` : ''),
          inline: false,
        });
      }

      await channel.send({ embeds: [embed] });

      // If there are more than 20 price drops, send additional messages
      if (dropFields.length > 20) {
        const remainingFields = dropFields.slice(20);
        const chunks = [];
        for (let i = 0; i < remainingFields.length; i += 25) {
          chunks.push(remainingFields.slice(i, i + 25));
        }

        for (const [index, chunk] of chunks.entries()) {
          await channel.send({
            embeds: [
              {
                title: `🎉 More Price Drops (${index + 2}/${chunks.length + 1})`,
                description: `**${listName}** (continued)`,
                color: 0x00ff00,
                fields: chunk,
                timestamp: new Date().toISOString(),
              },
            ],
          });
        }
      }
    }

    // Send price increases notification (if any and if drops are fewer)
    if (priceIncreases.length > 0 && priceDrops.length < 10) {
      await channel.send({
        embeds: [
          {
            title: '📈 Price Increases Detected',
            description: `**${listName}**\n\nFound ${priceIncreases.length} price increase${priceIncreases.length !== 1 ? 's' : ''}.`,
            color: 0xff6b6b, // Red color for price increases
            fields: increaseFields.slice(0, 25),
            timestamp: new Date().toISOString(),
            footer: {
              text: 'PC Parts Price Monitor',
            },
          },
        ],
      });
    }
  } catch (error) {
    console.error('Error sending list price notification:', error);
  }
}

module.exports = {
  createPriceMonitoringTask,
};
