const HTMLToMDXConverter = require('./converter');

async function testConverter() {
  console.log('🧪 Testing HTML to MDX Converter...\n');
  
  const converter = new HTMLToMDXConverter();
  
  try {
    // Convert 3 files
    const results = await converter.convertMultipleFiles(3);
    
    console.log(`\n📊 Conversion Results:`);
    console.log(`✅ Successfully converted: ${results.length} files`);
    
    results.forEach((result, index) => {
      console.log(`\n📄 File ${index + 1}: ${result.filename}`);
      console.log(`  Title: ${result.metadata.title}`);
      console.log(`  Author: ${result.metadata.author}`);
      console.log(`  Date: ${result.metadata.date}`);
      console.log(`  Hero Image: ${result.metadata.heroImage}`);
      console.log(`  Tags: [${result.metadata.tags.join(', ')}]`);
      console.log(`  Content Length: ${result.content.length} characters`);
    });
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n📁 Check the /src/posts/ directory for the generated MDX files.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testConverter().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('💥 Test crashed:', error.message);
});
