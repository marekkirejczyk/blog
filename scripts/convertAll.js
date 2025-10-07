const HTMLToMDXConverter = require('./converter');
const path = require('path');
const fs = require('fs-extra');

async function convertAllFiles() {
  console.log('🚀 Starting conversion of ALL HTML files to MDX...\n');
  
  const converter = new HTMLToMDXConverter();
  
  try {
    // Get all HTML files
    const htmlFiles = await converter.parser.getAllHTMLFiles();
    
    console.log(`📊 Found ${htmlFiles.length} HTML files to process\n`);
    
    // Get existing MDX files to avoid duplicates
    const existingMDX = await fs.readdir(converter.outputDir);
    console.log(`📁 Found ${existingMDX.length} existing MDX files\n`);
    
    const results = [];
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < htmlFiles.length; i++) {
      const file = htmlFiles[i];
      const fileName = path.basename(file);
      
      console.log(`\n[${i + 1}/${htmlFiles.length}] Processing: ${fileName}`);
      
      const result = await converter.convertFile(file);
      
      if (result.success) {
        // Check if file already exists
        if (existingMDX.includes(result.filename)) {
          console.log(`⏭️  Skipped (already exists): ${result.filename}`);
          skipCount++;
        } else {
          await converter.saveMDXFile(result.filename, result.content);
          successCount++;
        }
        results.push(result);
      } else {
        console.error(`❌ Failed: ${fileName} - ${result.error}`);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 CONVERSION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully converted: ${successCount} files`);
    console.log(`⏭️  Skipped (existing):    ${skipCount} files`);
    console.log(`❌ Failed:                 ${errorCount} files`);
    console.log(`📁 Total MDX files now:    ${successCount + existingMDX.length}`);
    console.log('='.repeat(60));
    
    console.log('\n🎉 Conversion completed!');
    console.log('📁 Check the /src/posts/ directory for all MDX files.\n');
    
    return results;
    
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run the conversion
convertAllFiles().then(() => {
  console.log('🏁 All done!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script crashed:', error.message);
  process.exit(1);
});

