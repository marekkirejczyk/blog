const fs = require('fs-extra');
const path = require('path');

/**
 * Validation script for converted MDX files
 * Checks structure, content quality, and identifies potential issues
 */
class MDXValidator {
  constructor() {
    this.postsDir = path.join(__dirname, '../src/posts');
    this.imagesDir = path.join(__dirname, '../public/images/posts');
  }

  /**
   * Validate all MDX files in the posts directory
   * @returns {Object} Validation results
   */
  async validateAllFiles() {
    console.log('🔍 Starting validation of converted MDX files...\n');
    
    const files = await this.getMDXFiles();
    const results = {
      total: files.length,
      passed: 0,
      failed: 0,
      issues: []
    };

    for (const file of files) {
      console.log(`📄 Validating: ${file}`);
      const validation = await this.validateFile(file);
      
      if (validation.passed) {
        results.passed++;
        console.log(`✅ ${file} - PASSED`);
      } else {
        results.failed++;
        console.log(`❌ ${file} - FAILED`);
        console.log(`   Issues: ${validation.issues.join(', ')}`);
        results.issues.push({
          file,
          issues: validation.issues
        });
      }
    }

    return results;
  }

  /**
   * Get all MDX files in posts directory
   * @returns {Array} Array of filenames
   */
  async getMDXFiles() {
    try {
      const files = await fs.readdir(this.postsDir);
      return files.filter(file => file.endsWith('.mdx'));
    } catch (error) {
      console.error('Error reading posts directory:', error.message);
      return [];
    }
  }

  /**
   * Validate a single MDX file
   * @param {string} filename - Name of the MDX file
   * @returns {Object} Validation result
   */
  async validateFile(filename) {
    const filePath = path.join(this.postsDir, filename);
    const issues = [];

    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Check file structure
      this.validateStructure(content, issues);
      
      // Check frontmatter
      this.validateFrontmatter(content, issues);
      
      // Check content quality
      this.validateContent(content, issues);
      
      // Check images
      await this.validateImages(content, issues);
      
      // Check filename format
      this.validateFilename(filename, issues);

      return {
        passed: issues.length === 0,
        issues
      };

    } catch (error) {
      return {
        passed: false,
        issues: [`File read error: ${error.message}`]
      };
    }
  }

  /**
   * Validate file structure (frontmatter, content separation)
   * @param {string} content - File content
   * @param {Array} issues - Issues array to populate
   */
  validateStructure(content, issues) {
    // Check for frontmatter
    if (!content.startsWith('---')) {
      issues.push('Missing frontmatter delimiter');
    }

    // Check for frontmatter end
    const frontmatterEnd = content.indexOf('\n---\n');
    if (frontmatterEnd === -1) {
      issues.push('Missing frontmatter end delimiter');
    }

    // Check for content after frontmatter
    if (frontmatterEnd !== -1) {
      const contentAfter = content.substring(frontmatterEnd + 5).trim();
      if (contentAfter.length === 0) {
        issues.push('No content after frontmatter');
      }
    }
  }

  /**
   * Validate frontmatter fields
   * @param {string} content - File content
   * @param {Array} issues - Issues array to populate
   */
  validateFrontmatter(content, issues) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      issues.push('Invalid frontmatter format');
      return;
    }

    const frontmatter = frontmatterMatch[1];
    const requiredFields = ['title', 'author', 'date', 'heroImage', 'tags'];
    
    for (const field of requiredFields) {
      if (!frontmatter.includes(`${field}:`)) {
        issues.push(`Missing required field: ${field}`);
      }
    }

    // Validate date format (YYYY-MM-DD)
    const dateMatch = frontmatter.match(/date:\s*"([^"]+)"/);
    if (dateMatch) {
      const date = dateMatch[1];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        issues.push(`Invalid date format: ${date}`);
      }
    }

    // Validate tags format
    const tagsMatch = frontmatter.match(/tags:\s*\[([^\]]+)\]/);
    if (tagsMatch) {
      const tagsStr = tagsMatch[1];
      if (tagsStr.trim().length === 0) {
        issues.push('Empty tags array');
      }
    }
  }

  /**
   * Validate content quality
   * @param {string} content - File content
   * @param {Array} issues - Issues array to populate
   */
  validateContent(content, issues) {
    // Check for content length
    const contentStart = content.indexOf('\n---\n') + 5;
    const actualContent = content.substring(contentStart).trim();
    
    if (actualContent.length < 100) {
      issues.push('Content too short (< 100 characters)');
    }

    // Check for remaining HTML artifacts
    const htmlPatterns = [
      /class="[^"]*"/g,
      /<section[^>]*>/g,
      /<div[^>]*>/g
    ];

    for (const pattern of htmlPatterns) {
      const matches = actualContent.match(pattern);
      if (matches && matches.length > 5) {
        issues.push('Too many HTML artifacts remaining');
        break;
      }
    }

    // Check for converted markdown elements
    const markdownElements = [
      /\*\*[^*]+\*\*/g,  // Bold
      /\*[^*]+\*/g,      // Italic
      /\[([^\]]+)\]\([^)]+\)/g,  // Links
      /#{1,6}\s+/g       // Headings
    ];

    let hasMarkdown = false;
    for (const pattern of markdownElements) {
      if (pattern.test(actualContent)) {
        hasMarkdown = true;
        break;
      }
    }

    if (!hasMarkdown) {
      issues.push('No markdown elements detected');
    }
  }

  /**
   * Validate image references
   * @param {string} content - File content
   * @param {Array} issues - Issues array to populate
   */
  async validateImages(content, issues) {
    try {
      // Find all image references
      const imageMatches = content.match(/src="([^"]+)"/g);
      if (!imageMatches) return;

      const localImages = await fs.readdir(this.imagesDir);
      
      for (const match of imageMatches) {
        const srcMatch = match.match(/src="([^"]+)"/);
        if (srcMatch) {
          const src = srcMatch[1];
          
          // Check if it's a local image
          if (src.startsWith('/images/posts/')) {
            const filename = path.basename(src);
            if (!localImages.includes(filename)) {
              issues.push(`Missing local image: ${filename}`);
            }
          }
          
          // Check for remaining Medium CDN URLs
          if (src.includes('cdn-images-1.medium.com')) {
            issues.push('Medium CDN URL not converted');
          }
        }
      }

    } catch (error) {
      issues.push(`Image validation error: ${error.message}`);
    }
  }

  /**
   * Validate filename format
   * @param {string} filename - Filename to validate
   * @param {Array} issues - Issues array to populate
   */
  validateFilename(filename, issues) {
    // Check format: YYYY-MM-DD-slug.mdx
    const pattern = /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.mdx$/;
    if (!pattern.test(filename)) {
      issues.push(`Invalid filename format: ${filename}`);
    }

    // Check for reasonable length
    if (filename.length > 100) {
      issues.push(`Filename too long: ${filename.length} characters`);
    }
  }

  /**
   * Generate validation report
   * @param {Object} results - Validation results
   */
  generateReport(results) {
    console.log('\n📊 VALIDATION REPORT');
    console.log('='.repeat(50));
    console.log(`Total files: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

    if (results.issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      results.issues.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.file}`);
        item.issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
      });
    } else {
      console.log('\n🎉 All files passed validation!');
    }
  }
}

module.exports = MDXValidator;
