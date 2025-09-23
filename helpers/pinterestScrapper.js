// helpers/pinterestScraper.js
import axios from "axios";
import cheerio from "cheerio";

/**
 * Scrape Pinterest search results for images
 * @param {string} query - Search term
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise<Array<{title: string, src: string, pinId: string, domain: string|null, link: string|null, width: number, height: number}>>}
 */
export async function scrapePinterest(query, limit = 10) {
  const results = [];
  
  try {
    // Validate inputs
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query parameter');
    }
    
    if (limit < 1 || limit > 50) {
      console.warn('[PINTEREST] Limit should be between 1-50, defaulting to 10');
      limit = 10;
    }

    const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query.trim())}`;
    
    console.log(`[PINTEREST] Scraping for: "${query}"`);
    
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "DNT": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
      },
      timeout: 15000,
      validateStatus: (status) => status < 500, // Don't throw on 404, etc.
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const $ = cheerio.load(response.data);
    
    // Method 1: Try to extract from __PWS_DATA__ script (primary method)
    const pwsScript = $('#__PWS_DATA__').html();
    if (pwsScript) {
      const pinsFromScript = extractPinsFromPWSData(pwsScript, limit);
      if (pinsFromScript.length > 0) {
        return pinsFromScript.slice(0, limit);
      }
    }

    // Method 2: Fallback - try to extract from initial state script
    const initialStateScript = $('script').filter((i, el) => 
      $(el).html()?.includes('window.__initialData__') ||
      $(el).html()?.includes('app[')
    ).first().html();

    if (initialStateScript) {
      const pinsFromInitial = extractPinsFromInitialState(initialStateScript, limit);
      if (pinsFromInitial.length > 0) {
        return pinsFromInitial.slice(0, limit);
      }
    }

    // Method 3: Final fallback - try to extract from HTML data attributes
    const pinsFromHTML = extractPinsFromHTML($, limit);
    if (pinsFromHTML.length > 0) {
      return pinsFromHTML.slice(0, limit);
    }

    console.warn('[PINTEREST] No pin data found using any extraction method');
    return [];

  } catch (error) {
    console.error('[PINTEREST SCRAPER ERROR]', error.message);
    
    // Provide more specific error information
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.error('[PINTEREST] Request timeout after 15 seconds');
      } else if (error.response) {
        console.error(`[PINTEREST] HTTP ${error.response.status} error`);
      } else if (error.request) {
        console.error('[PINTEREST] No response received from Pinterest');
      }
    }
    
    return [];
  }
}

/**
 * Extract pins from __PWS_DATA__ script (primary method)
 */
function extractPinsFromPWSData(scriptContent, limit) {
  try {
    const pwsData = JSON.parse(scriptContent);
    
    // Navigate through different possible structures
    const pins = 
      pwsData?.props?.initialReduxState?.pins ||
      pwsData?.resources?.pinStore?.pins ||
      pwsData?.pins;

    if (!pins || typeof pins !== 'object') {
      return [];
    }

    return processPinsObject(pins, limit);
  } catch (parseError) {
    console.warn('[PINTEREST] Failed to parse PWS_DATA:', parseError.message);
    return [];
  }
}

/**
 * Extract pins from initial state script (fallback method)
 */
function extractPinsFromInitialState(scriptContent, limit) {
  try {
    // Try to extract JSON from various script patterns
    const jsonMatch = scriptContent.match(/window\.__initialData__\s*=\s*({.*?})\s*;\s*</) ||
                     scriptContent.match(/app\["initialData"\]\s*=\s*({.*?})\s*;\s*</);
    
    if (jsonMatch) {
      const initialData = JSON.parse(jsonMatch[1]);
      const pins = initialData?.pins || initialData?.data?.pins;
      
      if (pins && typeof pins === 'object') {
        return processPinsObject(pins, limit);
      }
    }
    
    return [];
  } catch (error) {
    console.warn('[PINTEREST] Failed to parse initial state:', error.message);
    return [];
  }
}

/**
 * Extract pins directly from HTML elements (final fallback)
 */
function extractPinsFromHTML($, limit) {
  const results = [];
  
  try {
    // Look for pin containers and extract data from attributes
    $('[data-test-id="pin"], [data-grid-item], .PinCard').each((i, element) => {
      if (results.length >= limit) return false;
      
      const $el = $(element);
      const img = $el.find('img').first();
      
      if (img.length) {
        const src = img.attr('src') || img.attr('data-src');
        const alt = img.attr('alt') || 'Pinterest Image';
        
        if (src && src.includes('pinimg.com')) {
          results.push({
            title: alt,
            src: src.replace(/\/\d+x(\d+)?\//, '/originals/'), // Try to get original size
            pinId: $el.attr('data-id') || `html-${i}`,
            domain: null,
            link: $el.closest('a').attr('href') || null,
            width: 0,
            height: 0
          });
        }
      }
    });
    
    return results;
  } catch (error) {
    console.warn('[PINTEREST] HTML extraction failed:', error.message);
    return [];
  }
}

/**
 * Process pins object (can be array or key-value map)
 */
function processPinsObject(pins, limit) {
  const results = [];
  
  try {
    // Handle both array and object formats
    const pinArray = Array.isArray(pins) ? pins : Object.values(pins);
    
    for (const pin of pinArray) {
      if (results.length >= limit) break;
      if (!pin) continue;
      
      const processedPin = processSinglePin(pin);
      if (processedPin) {
        results.push(processedPin);
      }
    }
    
    return results;
  } catch (error) {
    console.warn('[PINTEREST] Pin processing failed:', error.message);
    return [];
  }
}

/**
 * Process a single pin object
 */
function processSinglePin(pin) {
  try {
    // Try different image URL locations
    const imageUrl = 
      pin?.images?.orig?.url ||
      pin?.image?.url ||
      pin?.image_url ||
      pin?.image_original_url;
    
    if (!imageUrl) return null;
    
    // Get title from various possible fields
    const title = 
      pin?.title ||
      pin?.description ||
      pin?.grid_title ||
      pin?.rich_summary?.display_name ||
      "Pinterest Image";
    
    // Get dimensions
    const width = pin?.images?.orig?.width || pin?.image_width || 0;
    const height = pin?.images?.orig?.height || pin?.image_height || 0;
    
    return {
      title: title.substring(0, 200), // Limit title length
      src: imageUrl,
      pinId: pin?.id || pin?.pin_id || Math.random().toString(36).substr(2, 9),
      domain: pin?.domain || null,
      link: pin?.link || pin?.url || null,
      width: width,
      height: height
    };
  } catch (error) {
    console.warn('[PINTEREST] Failed to process single pin');
    return null;
  }
}

/**
 * Utility function to delay between requests (prevent rate limiting)
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Batch scrape multiple queries with delays
 * @param {string[]} queries - Array of search queries
 * @param {number} limitPerQuery - Results per query (default: 5)
 * @param {number} delayMs - Delay between queries in ms (default: 2000)
 * @returns {Promise<Array<{query: string, results: Array}>>}
 */
export async function batchScrapePinterest(queries, limitPerQuery = 5, delayMs = 2000) {
  const allResults = [];
  
  for (const query of queries) {
    try {
      console.log(`[PINTEREST] Scraping batch query: "${query}"`);
      const results = await scrapePinterest(query, limitPerQuery);
      
      allResults.push({
        query: query,
        results: results,
        timestamp: new Date().toISOString()
      });
      
      // Delay between requests to be respectful
      if (delayMs > 0 && queries.indexOf(query) < queries.length - 1) {
        await delay(delayMs);
      }
    } catch (error) {
      console.error(`[PINTEREST] Batch query failed for "${query}":`, error.message);
      allResults.push({
        query: query,
        results: [],
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return allResults;
}
