const HTMLToMDXConverter = require('./converter');

async function testSpecificFiles() {
  console.log('🧪 Testing HTML to MDX Converter with specific files...\n');
  
  const converter = new HTMLToMDXConverter();
  
  // Define the specific files to test
  const testFiles = [
    {
      filename: '2014-01-24_How-to-prioritize-development-projects-with-Kanban-8fb86885a731.html',
      category: 'Old (2014)',
      description: 'Kanban prioritization post'
    },
    {
      filename: '2019-01-23_Waffle-2-0-released-93b9db6e67ea.html',
      category: 'Mid (2019)',
      description: 'Waffle 2.0 release post'
    },
    {
      filename: '2023-02-09_Running-a-dev-shop---part-4--Attracting-customers-cdf96fef74e3.html',
      category: 'New (2023)',
      description: 'Dev shop customer attraction post'
    }
  ];
  
  const results = [];
  
  console.log('🚀 Converting selected files...\n');
  
  for (const testFile of testFiles) {
    console.log(`📅 ${testFile.category}: ${testFile.description}`);
    console.log(`   File: ${testFile.filename}`);
    
    try {
      const filePath = `${__dirname}/../import/${testFile.filename}`;
      const result = await converter.convertFile(filePath);
      
      if (result.success) {
        await converter.saveMDXFile(result.filename, result.content);
        results.push({
          ...testFile,
          ...result,
          success: true
        });
        console.log(`   ✅ Converted: ${result.filename}`);
        console.log(`   📊 Content: ${result.content.length} characters`);
        console.log(`   🏷️  Tags: [${result.metadata.tags.join(', ')}]`);
        console.log(`   🖼️  Hero Image: ${result.metadata.heroImage}`);
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        results.push({
          ...testFile,
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
      results.push({
        ...testFile,
        success: false,
        error: error.message
      });
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📊 CONVERSION SUMMARY');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/3`);
  console.log(`❌ Failed: ${failed.length}/3`);
  
  if (successful.length > 0) {
    console.log('\n📄 Successfully converted files:');
    successful.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.category} - ${result.description}`);
      console.log(`   MDX: ${result.filename}`);
      console.log(`   Title: ${result.metadata.title}`);
      console.log(`   Date: ${result.metadata.date}`);
      console.log(`   Content: ${result.content.length} characters`);
      console.log(`   Tags: [${result.metadata.tags.join(', ')}]`);
      console.log(`   Hero Image: ${result.metadata.heroImage}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed conversions:');
    failed.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.category} - ${result.description}`);
      console.log(`   File: ${result.filename}`);
      console.log(`   Error: ${result.error}`);
    });
  }
  
  console.log('\n🎉 Test completed!');
  console.log('\n📁 Check the /src/posts/ directory for the generated MDX files.');
  
  return results;
}

// Run the test
testSpecificFiles().then(() => {
  console.log('\n🏁 Specific files test completed');
}).catch(error => {
  console.error('💥 Test crashed:', error.message);
});
