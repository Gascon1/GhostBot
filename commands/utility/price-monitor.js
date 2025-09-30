const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const PriceMonitoringService = require('../../lib/services/price-monitoring-service');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('price-monitor')
    .setDescription('Manage PC parts price monitoring')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a PCPartPicker list to monitor')
        .addStringOption((option) =>
          option
            .setName('url')
            .setDescription('PCPartPicker list URL (e.g., https://ca.pcpartpicker.com/list/tyktZc)')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option.setName('name').setDescription('Custom name for the list (optional)').setRequired(false),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName('list').setDescription('Show all monitored PC parts lists'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove a list from monitoring (keeps data)')
        .addIntegerOption((option) =>
          option
            .setName('id')
            .setDescription('List ID to remove (use /price-monitor list to see IDs)')
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Permanently delete a list and all its data (admin only)')
        .addIntegerOption((option) =>
          option
            .setName('id')
            .setDescription('List ID to delete permanently (use /price-monitor list to see IDs)')
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('check').setDescription('Manually trigger a price check (admin only)'),
    ),

  async execute(interaction) {
    const priceMonitoringService = new PriceMonitoringService();
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'add':
          await handleAddList(interaction, priceMonitoringService);
          break;
        case 'list':
          await handleListMonitored(interaction, priceMonitoringService);
          break;
        case 'remove':
          await handleRemoveList(interaction, priceMonitoringService);
          break;
        case 'delete':
          await handleDeleteList(interaction, priceMonitoringService);
          break;
        case 'check':
          await handleManualCheck(interaction, priceMonitoringService);
          break;
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true,
          });
      }
    } catch (error) {
      console.error('Error in price-monitor command:', error);

      const errorMessage = 'An error occurred while processing your request.';

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: errorMessage,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true,
        });
      }
    }
  },
};

/**
 * Handle adding a new list to monitor
 */
async function handleAddList(interaction, priceMonitoringService) {
  const url = interaction.options.getString('url');
  const customName = interaction.options.getString('name');

  await interaction.deferReply();

  const result = await priceMonitoringService.addMonitoredList(url, customName);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ List Added to Monitoring')
      .setDescription(result.message)
      .addFields(
        { name: 'List Name', value: result.listName, inline: true },
        { name: 'Parts Added', value: result.partsAdded.toString(), inline: true },
        { name: 'List ID', value: result.listId.toString(), inline: true },
      )
      .setColor(0x00ff00)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setTitle('❌ Failed to Add List')
      .setDescription(result.error)
      .setColor(0xff0000)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}

/**
 * Handle listing all monitored lists
 */
async function handleListMonitored(interaction, priceMonitoringService) {
  await interaction.deferReply();

  const lists = await priceMonitoringService.getMonitoredLists();

  if (lists.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('📋 Monitored Lists')
      .setDescription('No lists are currently being monitored.\n\nUse `/price-monitor add` to add a list!')
      .setColor(0x999999)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('📋 Monitored PC Parts Lists')
    .setDescription(
      `Currently monitoring ${lists.length} list${lists.length !== 1 ? 's' : ''}\n\n**To remove a list, use:** \`/price-monitor remove id:<ID>\`\n**To permanently delete:** \`/price-monitor delete id:<ID>\``,
    )
    .setColor(0x0099ff)
    .setTimestamp();

  // Add fields for each list
  for (const list of lists.slice(0, 25)) {
    // Discord limit of 25 fields
    const avgPrice = list.avg_price ? `$${parseFloat(list.avg_price).toFixed(2)}` : 'N/A';
    const minPrice = list.min_price ? `$${parseFloat(list.min_price).toFixed(2)}` : 'N/A';
    const maxPrice = list.max_price ? `$${parseFloat(list.max_price).toFixed(2)}` : 'N/A';

    embed.addFields({
      name: `🆔 ID: ${list.id} | ${list.list_name}`,
      value:
        `**Parts:** ${list.part_count}\n` +
        `**Price Range:** ${minPrice} - ${maxPrice}\n` +
        `**Average:** ${avgPrice}\n` +
        `**Added:** ${new Date(list.created_at).toLocaleDateString()}\n` +
        `**Remove command:** \`/price-monitor remove id:${list.id}\``,
      inline: true,
    });
  }

  if (lists.length > 25) {
    embed.setFooter({
      text: `Showing first 25 of ${lists.length} lists. Use individual commands for more details.`,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

/**
 * Handle removing a list from monitoring
 */
async function handleRemoveList(interaction, priceMonitoringService) {
  const listId = interaction.options.getInteger('id');

  await interaction.deferReply();

  const result = await priceMonitoringService.removeMonitoredList(listId);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ List Removed')
      .setDescription(result.message)
      .setColor(0x00ff00)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setTitle('❌ Failed to Remove List')
      .setDescription(result.error)
      .setColor(0xff0000)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}

/**
 * Handle manual price check (admin only)
 */
async function handleManualCheck(interaction, priceMonitoringService) {
  // Check if user has admin permissions
  if (!interaction.member.permissions.has('Administrator')) {
    await interaction.reply({
      content: '❌ This command requires Administrator permissions.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const result = await priceMonitoringService.checkPriceChanges();

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('🔍 Manual Price Check Complete')
      .setDescription(`**Lists Checked:** ${result.listsChecked}\n**Changes Found:** ${result.totalChanges}`)
      .setColor(0x0099ff)
      .setTimestamp();

    if (result.totalChanges > 0) {
      let changesText = '';
      for (const listData of result.priceChanges.slice(0, 5)) {
        // Show first 5 lists
        const drops = listData.changes.filter((c) => c.isDecrease).length;
        const increases = listData.changes.filter((c) => !c.isDecrease).length;
        changesText += `**${listData.listName}:** ${drops} drops, ${increases} increases\n`;
      }

      embed.addFields({
        name: 'Changes Summary',
        value: changesText || 'No changes detected',
      });

      if (result.priceChanges.length > 5) {
        embed.setFooter({
          text: `Showing first 5 lists. ${result.priceChanges.length - 5} more lists had changes.`,
        });
      }
    }

    await interaction.editReply({ embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setTitle('❌ Price Check Failed')
      .setDescription(result.error)
      .setColor(0xff0000)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}

/**
 * Handle permanently deleting a list from monitoring (admin only)
 */
async function handleDeleteList(interaction, priceMonitoringService) {
  // Check if user has admin permissions
  if (!interaction.member.permissions.has('Administrator')) {
    await interaction.reply({
      content: '❌ This command requires Administrator permissions.',
      ephemeral: true,
    });
    return;
  }

  const listId = interaction.options.getInteger('id');

  await interaction.deferReply();

  const result = await priceMonitoringService.deleteMonitoredList(listId);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('⚠️ List Permanently Deleted')
      .setDescription(result.message)
      .setColor(0xff6b6b)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setTitle('❌ Failed to Delete List')
      .setDescription(result.error)
      .setColor(0xff0000)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
}
