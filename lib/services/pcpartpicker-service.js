const axios = require('axios');
const cheerio = require('cheerio');

class PCPartPickerService {
  constructor() {
    this.baseURL = 'https://ca.pcpartpicker.com';

    // Set up axios with proper headers to avoid blocking
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });
  }

  /**
   * Extract list ID from PCPartPicker URL
   * @param {string} url - PCPartPicker list URL
   * @returns {string|null} - List ID or null if invalid
   */
  extractListId(url) {
    const match = url.match(/\/list\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  /**
   * Scrape parts and prices from a PCPartPicker list
   * @param {string} listUrl - PCPartPicker list URL
   * @returns {Promise<Object>} - Object containing list info and parts
   */
  async scrapeList(listUrl) {
    try {
      console.log(`Scraping PCPartPicker list: ${listUrl}`);

      const response = await this.client.get(listUrl);
      const $ = cheerio.load(response.data);

      const listName = this.extractListName($);
      const parts = this.extractParts($);

      return {
        success: true,
        listName,
        parts,
        totalParts: parts.length,
      };
    } catch (error) {
      console.error('Error scraping PCPartPicker list:', error.message);
      return {
        success: false,
        error: error.message,
        parts: [],
      };
    }
  }

  /**
   * Extract list name from the page
   * @param {CheerioAPI} $ - Cheerio instance
   * @returns {string} - List name
   */
  extractListName($) {
    // Try different selectors for list name
    let listName = $('h1').first().text().trim();

    if (!listName || listName === 'Part List') {
      // Fallback to page title
      listName = $('title').text().trim();
      if (listName.includes(' - ')) {
        listName = listName.split(' - ')[0];
      }
    }

    return listName || 'PC Build List';
  }

  /**
   * Extract parts data from the table
   * @param {CheerioAPI} $ - Cheerio instance
   * @returns {Array} - Array of part objects
   */
  extractParts($) {
    const parts = [];

    // Look for the parts table with the correct structure
    $('table tbody tr.tr__product').each((index, element) => {
      const $row = $(element);

      // Extract component type
      const partType = $row.find('.td__component a').text().trim();

      // Extract part name and URL
      const partNameLink = $row.find('.td__name a');
      const partName = partNameLink.text().trim();
      const partUrl = partNameLink.attr('href');

      // Extract price
      const priceText = $row.find('.td__price a').text().trim();
      const price = this.extractPrice(priceText);

      // Extract merchant from image alt text
      const merchantImg = $row.find('.td__where img');
      const merchant = merchantImg.length > 0 ? merchantImg.attr('alt') : 'Unknown';

      // Extract availability (remove the header text)
      const availability = $row
        .find('.td__availability')
        .text()
        .replace(/Availability/g, '')
        .trim();

      if (partType && partName && price > 0) {
        parts.push({
          type: partType,
          name: partName,
          url: partUrl ? (partUrl.startsWith('http') ? partUrl : this.baseURL + partUrl) : null,
          price: price,
          merchant: merchant,
          availability: availability || 'Unknown',
        });
      }
    });

    return parts;
  }

  /**
   * Extract numeric price from price string
   * @param {string} priceText - Price text (e.g., "$999.99", "C$1,234.56")
   * @returns {number} - Numeric price
   */
  extractPrice(priceText) {
    if (!priceText) return 0;

    // Remove currency symbols and commas, then parse
    const cleanPrice = priceText.replace(/[C$,\s]/g, '');
    const price = parseFloat(cleanPrice);

    return isNaN(price) ? 0 : price;
  }

  /**
   * Get the current lowest price for a part from multiple merchants
   * @param {string} partUrl - URL to the part's page
   * @returns {Promise<Object>} - Price information
   */
  async getPartPrice(partUrl) {
    try {
      const response = await this.client.get(partUrl);
      const $ = cheerio.load(response.data);

      // Look for price information in various selectors
      const prices = [];

      $('.price_table tr').each((index, element) => {
        const $row = $(element);
        const priceText = $row.find('.td__price').text().trim();
        const merchant = $row.find('.td__where').text().trim();
        const availability = $row.find('.td__availability').text().trim();

        const price = this.extractPrice(priceText);
        if (price > 0) {
          prices.push({
            price,
            merchant,
            availability,
          });
        }
      });

      // Return the lowest price
      if (prices.length > 0) {
        const lowestPrice = prices.reduce((min, current) => (current.price < min.price ? current : min));

        return {
          success: true,
          ...lowestPrice,
          allPrices: prices,
        };
      }

      return {
        success: false,
        error: 'No price found',
      };
    } catch (error) {
      console.error('Error getting part price:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate if a URL is a valid PCPartPicker list URL
   * @param {string} url - URL to validate
   * @returns {boolean} - True if valid
   */
  isValidListUrl(url) {
    return url.includes('pcpartpicker.com/list/') && this.extractListId(url) !== null;
  }
}

module.exports = PCPartPickerService;
