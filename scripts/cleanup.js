const fs = require('fs-extra');
const path = require('path');

/**
 * Cleanup script for removing original HTML files after successful conversion
 */
class CleanupManager {
  constructor() {
    this.importDir = path.join(__dirname, '../import');
    this.postsDir = path.join(__dirname, '../src/posts');
  }

  /**
   * Get list of successfully converted files
   * @returns {Array} Array of converted filenames
   */
  async getConvertedFiles() {
    try {
      const files = await fs.readdir(this.postsDir);
      return files.filter(file => file.endsWith('.mdx'));
    } catch (error) {
      console.error('Error reading posts directory:', error.message);
      return [];
    }
  }

  /**
   * Get list of original HTML files
   * @returns {Array} Array of HTML filenames
   */
  async getHTMLFiles() {
    try {
      const files = await fs.readdir(this.importDir);
      return files.filter(file => file.endsWith('.html'));
    } catch (error) {
      console.error('Error reading import directory:', error.message);
      return [];
    }
  }

  /**
   * Map HTML files to their corresponding MDX files
   * @param {Array} htmlFiles - Array of HTML filenames
   * @param {Array} mdxFiles - Array of MDX filenames
   * @returns {Array} Array of mappings
   */
  mapFilesToConverted(htmlFiles, mdxFiles) {
    const mappings = [];
    
    for (const htmlFile of htmlFiles) {
      // Extract date and title from HTML filename - handle both regular and draft files
      let match;
      let isDraft = false;
      
      // Try draft format first: draft_Title--hash.html
      match = htmlFile.match(/^draft_(.+)-[a-f0-9]{12}\.html$/);
      if (match) {
        isDraft = true;
      } else {
        // Try regular format: YYYY-MM-DD_Title--hash.html
        match = htmlFile.match(/^(\d{4}-\d{2}-\d{2})_(.+)-[a-f0-9]{12}\.html$/);
      }
      
      if (match) {
        let date, title;
        
        if (isDraft) {
          title = match[1];
          date = '2023-01-01'; // Default date for drafts
        } else {
          [, date, title] = match;
        }
        
        // Create expected MDX filename
        const expectedMDX = isDraft 
          ? `draft_${this.slugify(title)}.mdx`
          : `${date}-${this.slugify(title)}.mdx`;
        
        if (mdxFiles.includes(expectedMDX)) {
          mappings.push({
            htmlFile,
            mdxFile: expectedMDX,
            canDelete: true,
            isDraft
          });
        } else {
          mappings.push({
            htmlFile,
            mdxFile: null,
            canDelete: false,
            reason: 'No corresponding MDX file found',
            isDraft
          });
        }
      } else {
        mappings.push({
          htmlFile,
          mdxFile: null,
          canDelete: false,
          reason: 'Filename format not recognized'
        });
      }
    }
    
    return mappings;
  }

  /**
   * Simple slugify function
   * @param {string} text - Text to slugify
   * @returns {string} Slugified text
   */
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Validate that MDX files are properly converted
   * @param {Array} mdxFiles - Array of MDX filenames
   * @returns {Object} Validation result
   */
  async validateMDXFiles(mdxFiles) {
    const results = {
      total: mdxFiles.length,
      valid: 0,
      invalid: 0,
      errors: []
    };

    for (const mdxFile of mdxFiles) {
      try {
        const filePath = path.join(this.postsDir, mdxFile);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Check basic structure
        if (content.startsWith('---') && content.includes('\n---\n')) {
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
          if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const requiredFields = ['title', 'author', 'date', 'heroImage'];
            const hasAllFields = requiredFields.every(field => 
              frontmatter.includes(`${field}:`)
            );
            
            if (hasAllFields && content.length > 200) {
              results.valid++;
            } else {
              results.invalid++;
              results.errors.push(`${mdxFile}: Missing required fields or too short`);
            }
          } else {
            results.invalid++;
            results.errors.push(`${mdxFile}: Invalid frontmatter`);
          }
        } else {
          results.invalid++;
          results.errors.push(`${mdxFile}: Missing frontmatter`);
        }
      } catch (error) {
        results.invalid++;
        results.errors.push(`${mdxFile}: Read error - ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Perform cleanup with safety checks
   * @param {boolean} dryRun - If true, only show what would be deleted
   * @returns {Object} Cleanup results
   */
  async performCleanup(dryRun = true) {
    console.log(`🧹 Starting cleanup process (${dryRun ? 'DRY RUN' : 'LIVE'})...\n`);
    
    const htmlFiles = await this.getHTMLFiles();
    const mdxFiles = await this.getConvertedFiles();
    
    console.log(`📊 Files found:`);
    console.log(`  HTML files: ${htmlFiles.length}`);
    console.log(`  MDX files: ${mdxFiles.length}\n`);
    
    // Validate MDX files first
    console.log('🔍 Validating converted MDX files...');
    const validation = await this.validateMDXFiles(mdxFiles);
    
    console.log(`✅ Valid MDX files: ${validation.valid}`);
    console.log(`❌ Invalid MDX files: ${validation.invalid}`);
    
    if (validation.errors.length > 0) {
      console.log('\n🚨 Validation errors:');
      validation.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (validation.invalid > 0) {
      console.log('\n⚠️  Cannot proceed with cleanup due to invalid MDX files.');
      return { success: false, reason: 'Invalid MDX files found' };
    }
    
    // Map files
    const mappings = this.mapFilesToConverted(htmlFiles, mdxFiles);
    
    const canDelete = mappings.filter(m => m.canDelete);
    const cannotDelete = mappings.filter(m => !m.canDelete);
    
    console.log(`\n📋 Cleanup plan:`);
    console.log(`  ✅ Can delete: ${canDelete.length} HTML files`);
    console.log(`  ❌ Cannot delete: ${cannotDelete.length} HTML files`);
    
    if (cannotDelete.length > 0) {
      console.log('\n⚠️  Files that cannot be deleted:');
      cannotDelete.forEach(item => {
        console.log(`  - ${item.htmlFile}: ${item.reason}`);
      });
    }
    
    if (canDelete.length > 0) {
      console.log(`\n🗑️  Files to be deleted:`);
      canDelete.forEach(item => {
        console.log(`  - ${item.htmlFile} → ${item.mdxFile} ✅`);
      });
      
      if (!dryRun) {
        console.log('\n🗑️  Deleting HTML files...');
        let deletedCount = 0;
        
        for (const item of canDelete) {
          try {
            const htmlPath = path.join(this.importDir, item.htmlFile);
            await fs.remove(htmlPath);
            deletedCount++;
            console.log(`  ✅ Deleted: ${item.htmlFile}`);
          } catch (error) {
            console.log(`  ❌ Failed to delete ${item.htmlFile}: ${error.message}`);
          }
        }
        
        console.log(`\n🎉 Cleanup completed! Deleted ${deletedCount} HTML files.`);
      } else {
        console.log('\n💡 This was a dry run. Use dryRun=false to actually delete files.');
      }
    }
    
    return {
      success: true,
      canDelete: canDelete.length,
      cannotDelete: cannotDelete.length,
      dryRun
    };
  }

  /**
   * Create backup of HTML files before deletion
   * @param {string} backupDir - Backup directory path
   * @returns {Object} Backup result
   */
  async createBackup(backupDir = '../import-backup') {
    const backupPath = path.join(__dirname, backupDir);
    
    console.log(`💾 Creating backup to ${backupPath}...`);
    
    try {
      await fs.ensureDir(backupPath);
      await fs.copy(this.importDir, backupPath);
      console.log('✅ Backup created successfully');
      return { success: true, backupPath };
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = CleanupManager;
