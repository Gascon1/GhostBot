const database = require('../database');
const PCPartPickerService = require('./pcpartpicker-service');

class PriceMonitoringService {
  constructor() {
    this.pcppService = new PCPartPickerService();
  }

  /**
   * Add a new PCPartPicker list to monitor
   * @param {string} listUrl - PCPartPicker list URL
   * @param {string} listName - Custom name for the list (optional)
   * @returns {Promise<Object>} - Result object
   */
  async addMonitoredList(listUrl, customListName = null) {
    try {
      // Validate URL
      if (!this.pcppService.isValidListUrl(listUrl)) {
        return {
          success: false,
          error: 'Invalid PCPartPicker list URL',
        };
      }

      // Check if list already exists and is active
      const existing = await database.get(
        'SELECT id, is_active FROM monitored_lists WHERE list_url = ?',
        [listUrl],
      );

      if (existing) {
        if (existing.is_active) {
          return {
            success: false,
            error: 'This list is already being monitored',
          };
        } else {
          // Reactivate the existing list instead of creating a new one
          await database.run(
            'UPDATE monitored_lists SET is_active = 1, list_name = ?, updated_at = ? WHERE id = ?',
            [customListName || 'Reactivated List', new Date().toISOString(), existing.id],
          );

          return {
            success: true,
            listId: existing.id,
            listName: customListName || 'Reactivated List',
            partsAdded: 0, // Existing parts are preserved
            message: `Successfully reactivated monitoring for "${customListName || 'Reactivated List'}"`,
          };
        }
      }

      // Scrape the list to get initial data
      const listData = await this.pcppService.scrapeList(listUrl);

      if (!listData.success) {
        return {
          success: false,
          error: `Failed to scrape list: ${listData.error}`,
        };
      }

      const listName = customListName || listData.listName;
      const now = new Date().toISOString();

      // Insert the monitored list
      const listResult = await database.run(
        'INSERT INTO monitored_lists (list_url, list_name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [listUrl, listName, now, now],
      );

      const listId = listResult.id;

      // Insert all parts
      for (const part of listData.parts) {
        const partResult = await database.run(
          'INSERT INTO pc_parts (list_id, part_type, part_name, part_url, created_at) VALUES (?, ?, ?, ?, ?)',
          [listId, part.type, part.name, part.url, now],
        );

        // Insert initial price
        await database.run(
          'INSERT INTO price_history (part_id, price, merchant, availability, timestamp) VALUES (?, ?, ?, ?, ?)',
          [partResult.id, part.price, part.merchant, part.availability, now],
        );
      }

      return {
        success: true,
        listId,
        listName,
        partsAdded: listData.parts.length,
        message: `Successfully added "${listName}" with ${listData.parts.length} parts to monitoring`,
      };

    } catch (error) {
      console.error('Error adding monitored list:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check all monitored lists for price changes
   * @returns {Promise<Object>} - Result with price changes
   */
  async checkPriceChanges() {
    try {
      const activeLists = await database.all(
        'SELECT * FROM monitored_lists WHERE is_active = 1',
      );

      const allPriceChanges = [];

      for (const list of activeLists) {
        console.log(`Checking prices for list: ${list.list_name}`);

        const listChanges = await this.checkListPrices(list);
        if (listChanges.length > 0) {
          allPriceChanges.push({
            listName: list.list_name,
            listUrl: list.list_url,
            changes: listChanges,
          });
        }

        // Update the list's last checked time
        await database.run(
          'UPDATE monitored_lists SET updated_at = ? WHERE id = ?',
          [new Date().toISOString(), list.id],
        );
      }

      return {
        success: true,
        listsChecked: activeLists.length,
        totalChanges: allPriceChanges.reduce((sum, list) => sum + list.changes.length, 0),
        priceChanges: allPriceChanges,
      };

    } catch (error) {
      console.error('Error checking price changes:', error);
      return {
        success: false,
        error: error.message,
        priceChanges: [],
      };
    }
  }

  /**
   * Check prices for a specific list
   * @param {Object} list - List object from database
   * @returns {Promise<Array>} - Array of price changes
   */
  async checkListPrices(list) {
    const priceChanges = [];

    try {
      // Re-scrape the list to get current prices
      const currentData = await this.pcppService.scrapeList(list.list_url);

      if (!currentData.success) {
        console.error(`Failed to scrape list ${list.list_name}: ${currentData.error}`);
        return [];
      }

      // Get all parts for this list
      const parts = await database.all(
        'SELECT * FROM pc_parts WHERE list_id = ?',
        [list.id],
      );

      for (const part of parts) {
        // Find matching part in current data
        const currentPart = currentData.parts.find(p =>
          this.normalizePartName(p.name) === this.normalizePartName(part.part_name) ||
          p.name.includes(part.part_name.substring(0, 20)) ||
          part.part_name.includes(p.name.substring(0, 20)),
        );

        if (!currentPart) {
          console.log(`Part not found in current data: ${part.part_name}`);
          continue;
        }

        // Get the most recent price
        const lastPrice = await database.get(
          'SELECT * FROM price_history WHERE part_id = ? ORDER BY timestamp DESC LIMIT 1',
          [part.id],
        );

        if (!lastPrice) {
          console.log(`No price history for part: ${part.part_name}`);
          continue;
        }

        const priceDifference = currentPart.price - lastPrice.price;
        const priceDropThreshold = 0.01; // Only report changes greater than 1 cent

        // Check if there's a significant price change
        if (Math.abs(priceDifference) > priceDropThreshold) {
          // Insert new price record
          await database.run(
            'INSERT INTO price_history (part_id, price, merchant, availability, timestamp) VALUES (?, ?, ?, ?, ?)',
            [part.id, currentPart.price, currentPart.merchant, currentPart.availability, new Date().toISOString()],
          );

          // Record the price change
          priceChanges.push({
            partName: part.part_name,
            partType: part.part_type,
            oldPrice: lastPrice.price,
            newPrice: currentPart.price,
            priceDifference: priceDifference,
            percentChange: ((priceDifference / lastPrice.price) * 100).toFixed(2),
            merchant: currentPart.merchant,
            partUrl: part.part_url,
            isDecrease: priceDifference < 0,
          });
        }
      }

    } catch (error) {
      console.error(`Error checking prices for list ${list.list_name}:`, error);
    }

    return priceChanges;
  }

  /**
   * Normalize part names for better matching
   * @param {string} name - Part name
   * @returns {string} - Normalized name
   */
  normalizePartName(name) {
    return name.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Get all monitored lists
   * @returns {Promise<Array>} - Array of monitored lists
   */
  async getMonitoredLists() {
    try {
      const lists = await database.all(
        `SELECT 
          ml.*,
          COUNT(pp.id) as part_count,
          MIN(ph.price) as min_price,
          MAX(ph.price) as max_price,
          AVG(ph.price) as avg_price
        FROM monitored_lists ml
        LEFT JOIN pc_parts pp ON ml.id = pp.list_id
        LEFT JOIN price_history ph ON pp.id = ph.part_id
        WHERE ml.is_active = 1
        GROUP BY ml.id`,
      );

      return lists;
    } catch (error) {
      console.error('Error getting monitored lists:', error);
      return [];
    }
  }

  /**
   * Remove a monitored list
   * @param {number} listId - List ID to remove
   * @returns {Promise<Object>} - Result object
   */
  async removeMonitoredList(listId) {
    try {
      // Set list as inactive instead of deleting (preserve history)
      const result = await database.run(
        'UPDATE monitored_lists SET is_active = 0, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), listId],
      );

      if (result.changes > 0) {
        return {
          success: true,
          message: 'List removed from monitoring (data preserved)',
        };
      } else {
        return {
          success: false,
          error: 'List not found',
        };
      }
    } catch (error) {
      console.error('Error removing monitored list:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Permanently delete a monitored list and all its data
   * @param {number} listId - List ID to delete
   * @returns {Promise<Object>} - Result object
   */
  async deleteMonitoredList(listId) {
    try {
      // First, delete all price history for parts in this list
      await database.run(
        `DELETE FROM price_history 
         WHERE part_id IN (SELECT id FROM pc_parts WHERE list_id = ?)`,
        [listId],
      );

      // Then delete all parts for this list
      await database.run('DELETE FROM pc_parts WHERE list_id = ?', [listId]);

      // Finally, delete the list itself
      const result = await database.run('DELETE FROM monitored_lists WHERE id = ?', [listId]);

      if (result.changes > 0) {
        return {
          success: true,
          message: 'List permanently deleted with all data',
        };
      } else {
        return {
          success: false,
          error: 'List not found',
        };
      }
    } catch (error) {
      console.error('Error deleting monitored list:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get price history for a specific part
   * @param {number} partId - Part ID
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>} - Array of price history records
   */
  async getPartPriceHistory(partId, limit = 10) {
    try {
      return await database.all(
        `SELECT 
          ph.*,
          pp.part_name,
          pp.part_type
        FROM price_history ph
        JOIN pc_parts pp ON ph.part_id = pp.id
        WHERE ph.part_id = ?
        ORDER BY ph.timestamp DESC
        LIMIT ?`,
        [partId, limit],
      );
    } catch (error) {
      console.error('Error getting part price history:', error);
      return [];
    }
  }
}

module.exports = PriceMonitoringService;