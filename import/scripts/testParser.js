const MediumHTMLParser = require('./htmlParser');

async function testParser() {
  console.log('🧪 Testing HTML Parser...\n');
  
  const parser = new MediumHTMLParser();
  
  try {
    // Test parsing a single file
    const htmlFiles = await parser.getAllHTMLFiles();
    
    if (htmlFiles.length === 0) {
      console.log('❌ No HTML files found in import directory');
      return;
    }
    
    console.log(`📁 Found ${htmlFiles.length} HTML files`);
    
    // Test first file
    const testFile = htmlFiles[0];
    console.log(`\n🔍 Testing with file: ${require('path').basename(testFile)}`);
    
    const parsed = await parser.parseFile(testFile);
    
    console.log('\n📊 Parsed Metadata:');
    console.log(`  Title: ${parsed.metadata.title}`);
    console.log(`  Author: ${parsed.metadata.author}`);
    console.log(`  Date: ${parsed.metadata.date}`);
    console.log(`  Images found: ${parsed.images.length}`);
    
    if (parsed.images.length > 0) {
      console.log(`  First image: ${parsed.images[0].src}`);
      console.log(`  First image alt: ${parsed.images[0].alt || '(no alt text)'}`);
    }
    
    console.log(`\n📝 Content length: ${parsed.content.length} characters`);
    
    // Validate the parsed data
    const validation = parser.validateParsedData(parsed);
    console.log(`\n✅ Validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
    
    if (!validation.isValid) {
      console.log('❌ Validation errors:');
      validation.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Show a preview of the content
    const contentPreview = parsed.content.substring(0, 200) + '...';
    console.log(`\n📖 Content preview:\n${contentPreview}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testParser().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('💥 Test crashed:', error.message);
});
