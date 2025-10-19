const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const slugify = require('slugify');
const franc = require('franc');
const natural = require('natural');

const MediumHTMLParser = require('./htmlParser');

/**
 * Complete HTML to MDX Converter
 * Handles all conversion steps: parsing, tag generation, image relinking, content conversion, file generation
 */
class HTMLToMDXConverter {
  constructor() {
    this.parser = new MediumHTMLParser();
    this.importDir = path.join(__dirname, '../import');
    this.outputDir = path.join(__dirname, '../src/posts');
    this.imagesDir = path.join(__dirname, '../public/images/posts');
    
    // Initialize natural language processing
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    
    // Common tech terms for better tag generation
    this.techTerms = [
      'javascript', 'python', 'react', 'node', 'api', 'database', 'algorithm',
      'programming', 'development', 'software', 'code', 'testing', 'debugging',
      'agile', 'kanban', 'scrum', 'devops', 'frontend', 'backend', 'mobile',
      'web', 'design', 'ui', 'ux', 'performance', 'security', 'architecture'
    ];
  }

  /**
   * Convert a single HTML file to MDX
   * @param {string} filePath - Path to HTML file
   * @returns {Object} Conversion result
   */
  async convertFile(filePath) {
    try {
      console.log(`🔄 Converting: ${path.basename(filePath)}`);
      
      // Step 1: Parse HTML
      const parsed = await this.parser.parseFile(filePath);
      
      // Step 2: Skip tag generation for now
      const tags = [];
      
      // Step 3: Process images and get hero image
      const { processedImages, heroImage } = await this.processImages(parsed.images);
      
      // Step 4: Convert content to MDX
      const mdxContent = await this.convertContentToMDX(parsed.content, processedImages);
      
      // Step 5: Generate frontmatter
      const frontmatter = this.generateFrontmatter({
        ...parsed.metadata,
        heroImage,
        tags
      });
      
      // Step 6: Generate filename
      const filename = this.generateFilename(parsed.metadata.date, parsed.metadata.title);
      
      // Step 7: Create final MDX content
      const finalMDX = `${frontmatter}\n\n${mdxContent}`;
      
      return {
        filename,
        content: finalMDX,
        metadata: {
          ...parsed.metadata,
          heroImage,
          tags
        },
        success: true
      };
      
    } catch (error) {
      console.error(`❌ Failed to convert ${path.basename(filePath)}:`, error.message);
      return {
        filename: path.basename(filePath),
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate tags from content using topic modeling
   * @param {string} content - HTML content
   * @returns {Array} Array of 3-5 tags
   */
  async generateTags(content) {
    try {
      // Clean HTML and extract text
      const $ = cheerio.load(content);
      const text = $('body').text().toLowerCase();
      
      // Tokenize and filter
      const tokens = this.tokenizer.tokenize(text)
        .filter(token => token.length > 3)
        .filter(token => /^[a-zA-Z]+$/.test(token));
      
      // Count word frequency
      const wordCount = {};
      tokens.forEach(token => {
        const stemmed = this.stemmer.stem(token);
        wordCount[stemmed] = (wordCount[stemmed] || 0) + 1;
      });
      
      // Prioritize tech terms and frequent words
      const scoredWords = Object.entries(wordCount).map(([word, count]) => {
        let score = count;
        if (this.techTerms.includes(word)) score *= 2;
        if (word.length > 6) score *= 1.5;
        return { word, score };
      });
      
      // Get top tags
      const topTags = scoredWords
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(item => item.word)
        .filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
        .slice(0, 5);
      
      // Fallback tags if not enough found
      if (topTags.length < 3) {
        topTags.push('development', 'programming', 'software');
      }
      
      return topTags.slice(0, 5);
      
    } catch (error) {
      console.warn('Tag generation failed, using fallback tags:', error.message);
      return ['development', 'programming', 'software', 'technology'];
    }
  }

  /**
   * Process images and map to local files
   * @param {Array} images - Array of image objects
   * @returns {Object} Processed images and hero image
   */
  async processImages(images) {
    const processedImages = [];
    let heroImage = 'Unknown image';
    
    try {
      // Get list of available local images
      const localImages = await fs.readdir(this.imagesDir);
      
      for (const image of images) {
        const originalSrc = image.src;
        
        // Extract filename from Medium CDN URL
        const urlParts = originalSrc.split('/');
        const filename = urlParts[urlParts.length - 1];
        
        // Check if local file exists
        const localPath = `/images/posts/${filename}`;
        const localFileExists = localImages.includes(filename);
        
        processedImages.push({
          ...image,
          localPath: localPath,
          localFileExists,
          originalSrc
        });
        
        // Set first image as hero image if it exists locally
        if (image.isFirst && localFileExists && heroImage === 'Unknown image') {
          heroImage = localPath;
        }
      }
      
    } catch (error) {
      console.warn('Image processing failed:', error.message);
    }
    
    return { processedImages, heroImage };
  }

  /**
   * Convert HTML content to MDX format
   * @param {string} htmlContent - HTML content
   * @param {Array} images - Processed images array
   * @returns {string} MDX content
   */
  async convertContentToMDX(htmlContent, images) {
    const $ = cheerio.load(htmlContent);
    
    // Remove title, author, date from content (already in frontmatter)
    $('h1, h2, h3').each((i, el) => {
      const $el = $(el);
      if ($el.text().trim().length < 100) { // Likely a title
        $el.remove();
      }
    });
    
    // Convert images to local paths
    $('img').each((i, el) => {
      const $img = $(el);
      const src = $img.attr('src');
      
      // Find matching processed image
      const processedImage = images.find(img => img.originalSrc === src);
      
      if (processedImage && processedImage.localFileExists) {
        // Check if this is the hero image (first image)
        if (processedImage.isFirst) {
          // Remove the hero image from content since it's already in frontmatter
          $img.remove();
          return;
        }
        $img.attr('src', processedImage.localPath);
      } else if (src && src.includes('cdn-images-1.medium.com')) {
        // Try to find local image by filename if not found in processed list
        const filename = path.basename(src);
        const localImages = require('fs').readdirSync(this.imagesDir);
        if (localImages.includes(filename)) {
          $img.attr('src', `/images/posts/${filename}`);
        }
      }
    });
    
    // Convert HTML elements to markdown-like structure
    this.convertHTMLToMarkdown($);
    
    // Detect and convert code blocks
    this.convertCodeBlocks($);
    
    // Clean up remaining HTML structure
    this.cleanupHTMLStructure($);
    
    // Get the cleaned content and normalize text
    let content = $('body').html() || $.html();
    content = this.cleanHTMLText(content);
    
    return content;
  }

  /**
   * Convert HTML elements to markdown-like structure
   * @param {Object} $ - Cheerio instance
   */
  convertHTMLToMarkdown($) {
    // Convert headings
    $('h3').each((i, el) => {
      $(el).replaceWith(`### ${$(el).text()}\n`);
    });
    
    $('h4').each((i, el) => {
      $(el).replaceWith(`#### ${$(el).text()}\n`);
    });
    
    $('h5').each((i, el) => {
      $(el).replaceWith(`##### ${$(el).text()}\n`);
    });
    
    $('h6').each((i, el) => {
      $(el).replaceWith(`###### ${$(el).text()}\n`);
    });
    
    // Convert strong to bold
    $('strong').each((i, el) => {
      $(el).replaceWith(`**${$(el).text()}**`);
    });
    
    // Convert em to italic
    $('em').each((i, el) => {
      $(el).replaceWith(`*${$(el).text()}*`);
    });
    
    // Convert links
    $('a').each((i, el) => {
      const $a = $(el);
      const href = $a.attr('href');
      const text = $a.text();
      // Add spacing around links to prevent them from running together
      $(el).replaceWith(` [${text}](${href}) `);
    });
    
    // Convert lists
    $('ul').each((i, el) => {
      const $ul = $(el);
      let markdown = '\n';
      $ul.find('li').each((j, li) => {
        markdown += `- ${$(li).text().trim()}\n`;
      });
      markdown += '\n';
      $(el).replaceWith(markdown);
    });
    
    $('ol').each((i, el) => {
      const $ol = $(el);
      let markdown = '\n';
      $ol.find('li').each((j, li) => {
        markdown += `${j + 1}. ${$(li).text().trim()}\n`;
      });
      markdown += '\n';
      $(el).replaceWith(markdown);
    });
    
    // Convert blockquotes
    $('blockquote').each((i, el) => {
      const text = $(el).text();
      $(el).replaceWith(`> ${text}\n`);
    });
  }

  /**
   * Convert code blocks with language detection
   * @param {Object} $ - Cheerio instance
   */
  convertCodeBlocks($) {
    $('pre code').each((i, el) => {
      const $code = $(el);
      const codeText = $code.text();
      
      // Detect language
      const language = this.detectLanguage(codeText);
      
      // Create markdown code block
      const markdown = `\`\`\`${language}\n${codeText}\n\`\`\`\n`;
      $(el).replaceWith(markdown);
    });
    
    // Convert inline code
    $('code').each((i, el) => {
      const $code = $(el);
      if (!$code.parent().is('pre')) {
        $(el).replaceWith(`\`${$code.text()}\``);
      }
    });
  }

  /**
   * Clean up HTML structure and remove artifacts
   * @param {Object} $ - Cheerio instance
   */
  cleanupHTMLStructure($) {
    // Remove all script tags and embedded content
    $('script, iframe, embed').remove();
    
    // Convert gist embeds to simple text
    $('figure script').each((i, el) => {
      const $script = $(el);
      const src = $script.attr('src');
      if (src && src.includes('gist.github.com')) {
        $script.parent().replaceWith('\n\n*[Code snippet from Gist]*\n\n');
      }
    });
    
    // Remove unnecessary wrapper elements
    $('.section-divider, .section-content, .section-inner').each((i, el) => {
      $(el).replaceWith($(el).contents());
    });
    
    // Remove empty divs and sections
    $('div, section').each((i, el) => {
      const $el = $(el);
      if ($el.children().length === 0 && $el.text().trim() === '') {
        $el.remove();
      } else if ($el.children().length === 1 && !$el.children().is('p, h1, h2, h3, h4, h5, h6, img, figure, ul, ol, blockquote, pre')) {
        $el.replaceWith($(el).contents());
      }
    });
    
    // Clean up figure elements - convert to simple images
    $('figure').each((i, el) => {
      const $fig = $(el);
      const $img = $fig.find('img');
      if ($img.length === 1) {
        const src = $img.attr('src');
        const alt = $img.attr('alt') || '';
        const caption = $fig.find('figcaption').text().trim();
        
        let imgMarkdown = `![${alt}](${src})`;
        if (caption) {
          imgMarkdown += `\n\n*${caption}*`;
        }
        
        $fig.replaceWith(imgMarkdown + '\n\n');
      } else {
        // Remove empty figure elements
        $fig.remove();
      }
    });
    
    // Remove all HTML attributes
    $('*').each((i, el) => {
      const $el = $(el);
      $el.removeAttr('class');
      $el.removeAttr('id');
      $el.removeAttr('name');
      $el.removeAttr('data-image-id');
      $el.removeAttr('data-width');
      $el.removeAttr('data-height');
      $el.removeAttr('data-is-featured');
      $el.removeAttr('data-external-src');
      $el.removeAttr('style');
      $el.removeAttr('title');
      $el.removeAttr('rel');
      $el.removeAttr('target');
    });
    
    // Remove empty paragraphs and elements
    $('p, div, span').each((i, el) => {
      const $el = $(el);
      if ($el.text().trim() === '' && $el.children().length === 0) {
        $el.remove();
      }
    });
    
    // Convert remaining HTML tags to plain text where appropriate
    $('br').each((i, el) => {
      $(el).replaceWith('\n');
    });
    
    $('strong, b').each((i, el) => {
      const text = $(el).text();
      $(el).replaceWith(`**${text}**`);
    });
    
    $('em, i').each((i, el) => {
      const text = $(el).text();
      $(el).replaceWith(`*${text}*`);
    });
    
    // Remove any remaining HTML tags that shouldn't be in markdown
    $('span, div').each((i, el) => {
      const $el = $(el);
      if (!$el.children().length) {
        $el.replaceWith($el.text());
      }
    });
    
    // Remove remaining wrapper tags like section, article
    $('section, article').each((i, el) => {
      $(el).replaceWith($(el).contents());
    });
    
    // Convert paragraph tags to plain text with proper spacing
    $('p').each((i, el) => {
      const $p = $(el);
      const text = $p.text().trim();
      if (text) {
        // Check if this paragraph contains multiple consecutive links (navigation)
        const links = $p.find('a');
        if (links.length > 2) {
          // For navigation paragraphs with multiple links, add line breaks between links
          let content = $p.html();
          content = content.replace(/\]\([^)]+\)\s*\[/g, ']\n[');
          $p.replaceWith(content + '\n\n');
        } else {
          $p.replaceWith(text + '\n\n');
        }
      } else {
        $p.remove();
      }
    });
    
    // Ensure headers have proper spacing
    $('h1, h2, h3, h4, h5, h6').each((i, el) => {
      const $h = $(el);
      const text = $h.text().trim();
      if (text) {
        $h.replaceWith('\n\n' + text + '\n\n');
      }
    });
    
    // Add proper spacing between other elements
    $('ul, ol, blockquote').each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (text) {
        $el.before('\n\n');
        $el.after('\n\n');
      }
    });
  }
  
  /**
   * Clean up HTML entities and normalize text
   * @param {string} html - HTML content
   * @returns {string} Cleaned HTML
   */
  cleanHTMLText(html) {
    return html
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      // Add line breaks between consecutive links (navigation patterns)
      .replace(/\]\([^)]+\)\s*\[/g, ']\n[')
      .replace(/\]\([^)]+\)\s*([A-Za-z])/g, ']\n$1')
      // Handle specific navigation pattern with emojis and links
      .replace(/([🎮🥾🎤📈])\s*\[/g, '$1\n[')
      // Preserve line breaks but normalize multiple spaces
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Detect programming language from code
   * @param {string} code - Code text
   * @returns {string} Language name
   */
  detectLanguage(code) {
    try {
      const detected = franc(code);
      
      // Map franc codes to common language names
      const languageMap = {
        'js': 'javascript',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'cs': 'csharp',
        'rb': 'ruby',
        'php': 'php',
        'go': 'go',
        'rs': 'rust',
        'swift': 'swift',
        'kt': 'kotlin',
        'sql': 'sql',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'md': 'markdown'
      };
      
      return languageMap[detected] || 'text';
      
    } catch (error) {
      return 'text';
    }
  }

  /**
   * Generate frontmatter for MDX
   * @param {Object} metadata - Post metadata
   * @returns {string} Frontmatter string
   */
  generateFrontmatter(metadata) {
    const tagsLine = metadata.tags && metadata.tags.length > 0 
      ? `tags: [${metadata.tags.map(tag => `"${tag}"`).join(', ')}]`
      : '# tags: [] # No tags generated';
    
    return `---
title: "${metadata.title}"
author: "${metadata.author}"
date: "${metadata.date}"
heroImage: "${metadata.heroImage}"
${tagsLine}
---`;
  }

  /**
   * Generate filename based on date and title
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} title - Post title
   * @returns {string} Filename
   */
  generateFilename(date, title) {
    const slug = slugify(title, { lower: true, strict: true });
    return `${date}-${slug}.mdx`;
  }

  /**
   * Save MDX file
   * @param {string} filename - Filename
   * @param {string} content - MDX content
   */
  async saveMDXFile(filename, content) {
    const filePath = path.join(this.outputDir, filename);
    await fs.ensureDir(this.outputDir);
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`✅ Saved: ${filename}`);
  }

  /**
   * Convert multiple files (for testing)
   * @param {number} count - Number of files to convert
   * @returns {Array} Conversion results
   */
  async convertMultipleFiles(count = 3) {
    const htmlFiles = await this.parser.getAllHTMLFiles();
    const filesToConvert = htmlFiles.slice(0, count);
    const results = [];
    
    console.log(`🚀 Converting ${filesToConvert.length} files...\n`);
    
    for (const file of filesToConvert) {
      const result = await this.convertFile(file);
      
      if (result.success) {
        await this.saveMDXFile(result.filename, result.content);
        results.push(result);
      } else {
        console.error(`❌ Failed: ${result.filename} - ${result.error}`);
      }
    }
    
    return results;
  }
}

module.exports = HTMLToMDXConverter;
