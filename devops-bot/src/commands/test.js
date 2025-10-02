
const logger = require('../utils/logger');
const { runE2ETests } = require('../tests/runner');

const testAll = async (ctx) => {
  try {
    await ctx.reply('🧪 Starting full E2E test suite...\n\nThis may take 10-15 minutes.');
    
    global.botState.testInProgress = true;
    const results = await runE2ETests('all');
    global.botState.testInProgress = false;
    
    const passed = results.passed;
    const total = results.total;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    let emoji = '✅';
    if (successRate < 100) emoji = '⚠️';
    if (successRate < 90) emoji = '❌';
    
    const message = `
${emoji} *E2E Test Results*

*Summary:*
✅ Passed: ${passed}/${total} (${successRate}%)
❌ Failed: ${results.failed}
⏭ Skipped: ${results.skipped}
⏱ Duration: ${results.duration}

*By Category:*
${results.categories.map(cat => `${cat.ok ? '✅' : '❌'} ${cat.name}: ${cat.passed}/${cat.total}`).join('\n')}

${results.failed > 0 ? `\n*Failed Tests:*\n${results.failedTests.map(t => `❌ ${t}`).join('\n')}` : ''}

${results.criticalFailures ? '\n🚨 *CRITICAL FAILURES DETECTED!*' : ''}
    `;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
    
    if (results.criticalFailures) {
      await ctx.reply(
        '⚠️ Critical failures detected. Consider rolling back.\n\nUse /rollback to revert to previous version.',
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    logger.error('Test all command error:', error);
    await ctx.reply('❌ Error running tests: ' + error.message);
    global.botState.testInProgress = false;
  }
};

const testCritical = async (ctx) => {
  try {
    await ctx.reply('🔥 Running critical tests...');
    
    const results = await runE2ETests('critical');
    
    const message = `
🔥 *Critical Tests Results*

${results.passed === results.total ? '✅' : '❌'} Status: ${results.passed}/${results.total} passed

*Tests:*
${results.tests.map(t => `${t.passed ? '✅' : '❌'} ${t.name} (${t.duration}ms)`).join('\n')}

${results.failed > 0 ? '\n🚨 *CRITICAL SYSTEM FAILURE!*' : '\n✅ All critical systems operational'}
    `;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Test critical command error:', error);
    await ctx.reply('❌ Error running critical tests: ' + error.message);
  }
};

const testSpecific = async (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length === 0) {
      await ctx.reply('Usage: /test [function]\n\nExamples:\n/test registration\n/test checkout\n/test seller-orders');
      return;
    }
    
    const testName = args.join(' ');
    await ctx.reply(`🧪 Testing: ${testName}...`);
    
    const result = await runE2ETests('specific', testName);
    
    const message = `
${result.passed ? '✅' : '❌'} *Test: ${testName}*

Status: ${result.status}
Duration: ${result.duration}ms

${result.error ? `\nError: ${result.error}` : ''}
${result.details ? `\nDetails: ${result.details}` : ''}
    `;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Test specific command error:', error);
    await ctx.reply('❌ Error running test: ' + error.message);
  }
};

module.exports = {
  testAll,
  testCritical,
  testSpecific
};
