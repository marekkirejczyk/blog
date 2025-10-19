const CleanupManager = require('./cleanup');

async function testCleanup() {
  console.log('🧹 Testing Cleanup Manager...\n');
  
  const cleanup = new CleanupManager();
  
  try {
    // First, run a dry run to see what would be deleted
    console.log('🔍 Running dry run to analyze cleanup...');
    const dryRunResult = await cleanup.performCleanup(true);
    
    if (!dryRunResult.success) {
      console.log('❌ Cleanup cannot proceed:', dryRunResult.reason);
      return;
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 CLEANUP ANALYSIS COMPLETE');
    console.log('='.repeat(50));
    
    // Ask user if they want to proceed with actual cleanup
    console.log('\n💡 Next steps:');
    console.log('1. Review the dry run results above');
    console.log('2. If satisfied, you can run the actual cleanup');
    console.log('3. Consider creating a backup first');
    
    console.log('\n🔧 To proceed with actual cleanup:');
    console.log('   node -e "require(\'./scripts/cleanup\').new().performCleanup(false).then(console.log)"');
    
    console.log('\n💾 To create a backup:');
    console.log('   node -e "require(\'./scripts/cleanup\').new().createBackup().then(console.log)"');
    
  } catch (error) {
    console.error('❌ Cleanup test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testCleanup().then(() => {
  console.log('\n🏁 Cleanup test completed');
}).catch(error => {
  console.error('💥 Cleanup test crashed:', error.message);
});
