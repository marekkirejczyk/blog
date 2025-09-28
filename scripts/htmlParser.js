const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

/**
 * HTML Parser for Medium Export Files
 * Extracts metadata and content from Medium HTML exports
 */
class MediumHTMLParser {
  constructor() {
    this.importDir = path.join(__dirname, '../import');
    this.outputDir = path.join(__dirname, '../src/posts');
  }

  /**
   * Parse a single HTML file and extract metadata and content
   * @param {string} filePath - Path to the HTML file
   * @returns {Object} Parsed data with metadata and content
   */
  async parseFile(filePath) {
    try {
      const html = await fs.readFile(filePath, 'utf8');
      const $ = cheerio.load(html);
      
      // Extract metadata
      const metadata = this.extractMetadata($);
      
      // Extract content
      const content = this.extractContent($);
      
      // Extract images
      const images = this.extractImages($);
      
      return {
        filename: path.basename(filePath),
        metadata,
        content,
        images,
        rawHtml: html
      };
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Extract metadata from HTML
   * @param {Object} $ - Cheerio instance
   * @returns {Object} Metadata object
   */
  extractMetadata($) {
    // Extract title
    const title = $('h1.p-name').text().trim() || 'Unknown title';
    
    // Extract author
    const authorElement = $('a.p-author.h-card');
    const author = authorElement.text().trim() || 'Unknown author';
    
    // Extract date
    const dateElement = $('time.dt-published');
    const dateTime = dateElement.attr('datetime');
    let date = 'Unknown date';
    
    if (dateTime) {
      try {
        const dateObj = new Date(dateTime);
        date = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
      } catch (e) {
        console.warn(`Could not parse date: ${dateTime}`);
      }
    }
    
    return {
      title,
      author,
      date,
      heroImage: 'Unknown image' // Will be updated when we process images
    };
  }

  /**
   * Extract content from HTML body
   * @param {Object} $ - Cheerio instance
   * @returns {string} Clean content HTML
   */
  extractContent($) {
    // Get the main content section
    const contentSection = $('section[data-field="body"].e-content');
    
    if (contentSection.length === 0) {
      console.warn('No content section found');
      return '';
    }
    
    // Clone the content section to avoid modifying the original
    const content = contentSection.clone();
    
    // Remove any unwanted elements that might be in the content
    content.find('header, footer').remove();
    
    return content.html() || '';
  }

  /**
   * Extract images from content
   * @param {Object} $ - Cheerio instance
   * @returns {Array} Array of image objects
   */
  extractImages($) {
    const images = [];
    
    $('section[data-field="body"].e-content img').each((index, element) => {
      const $img = $(element);
      const src = $img.attr('src');
      const alt = $img.attr('alt') || '';
      const dataImageId = $img.attr('data-image-id') || '';
      
      if (src) {
        images.push({
          src,
          alt,
          dataImageId,
          isFirst: index === 0 // Mark first image as potential hero image
        });
      }
    });
    
    return images;
  }

  /**
   * Get all HTML files in the import directory
   * @returns {Array} Array of file paths
   */
  async getAllHTMLFiles() {
    try {
      const files = await fs.readdir(this.importDir);
      return files
        .filter(file => file.endsWith('.html'))
        .map(file => path.join(this.importDir, file));
    } catch (error) {
      console.error('Error reading import directory:', error.message);
      return [];
    }
  }

  /**
   * Parse all HTML files in the import directory
   * @returns {Array} Array of parsed data objects
   */
  async parseAllFiles() {
    const files = await this.getAllHTMLFiles();
    const results = [];
    
    console.log(`Found ${files.length} HTML files to parse`);
    
    for (const file of files) {
      try {
        const parsed = await this.parseFile(file);
        results.push(parsed);
        console.log(`✓ Parsed: ${parsed.filename}`);
      } catch (error) {
        console.error(`✗ Failed to parse: ${path.basename(file)}`, error.message);
      }
    }
    
    return results;
  }

  /**
   * Validate parsed data structure
   * @param {Object} data - Parsed data object
   * @returns {Object} Validation result
   */
  validateParsedData(data) {
    const errors = [];
    
    if (!data.metadata.title || data.metadata.title === 'Unknown title') {
      errors.push('Missing or invalid title');
    }
    
    if (!data.metadata.author || data.metadata.author === 'Unknown author') {
      errors.push('Missing or invalid author');
    }
    
    if (!data.metadata.date || data.metadata.date === 'Unknown date') {
      errors.push('Missing or invalid date');
    }
    
    if (!data.content || data.content.trim().length === 0) {
      errors.push('Missing or empty content');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = MediumHTMLParser;
