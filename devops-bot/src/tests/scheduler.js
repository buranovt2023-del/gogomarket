
const cron = require('node-cron');
const logger = require('../utils/logger');
const { runE2ETests } = require('./runner');

let bot = null;

function scheduleE2ETests(botInstance) {
  bot = botInstance;
  logger.info('Scheduling E2E tests...');
  
  // Run tests every 4 hours (at 0:00, 4:00, 8:00, 12:00, 16:00, 20:00)
  cron.schedule('0 */4 * * *', async () => {
    logger.info('Starting scheduled E2E tests...');
    
    try {
      await bot.telegram.sendMessage(
        process.env.TELEGRAM_ADMIN_CHAT_ID,
        '🧪 Starting scheduled E2E tests...\n\nThis will take 10-15 minutes.',
        { parse_mode: 'Markdown' }
      );
      
      const results = await runE2ETests('all');
      
      await sendTestResults(results);
      
    } catch (error) {
      logger.error('Scheduled E2E tests error:', error);
      await bot.telegram.sendMessage(
        process.env.TELEGRAM_ADMIN_CHAT_ID,
        `❌ Scheduled E2E tests failed!\n\nError: ${error.message}`,
        { parse_mode: 'Markdown' }
      );
    }
  });
  
  logger.info('E2E tests scheduled (every 4 hours)');
}

async function sendTestResults(results) {
  const passed = results.passed;
  const total = results.total;
  const successRate = ((passed / total) * 100).toFixed(1);
  
  let emoji = '✅';
  if (successRate < 100) emoji = '⚠️';
  if (successRate < 90) emoji = '❌';
  
  const message = `
${emoji} *Scheduled E2E Test Results*

*Summary:*
✅ Passed: ${passed}/${total} (${successRate}%)
❌ Failed: ${results.failed}
⏱ Duration: ${results.duration}

*By Category:*
${results.categories.map(cat => `${cat.ok ? '✅' : '❌'} ${cat.name}: ${cat.passed}/${cat.total}`).join('\n')}

${results.failed > 0 ? `\n*Failed Tests:*\n${results.failedTests.slice(0, 5).map(t => `❌ ${t}`).join('\n')}${results.failedTests.length > 5 ? '\n... and more' : ''}` : ''}

${results.criticalFailures ? '\n🚨 *CRITICAL FAILURES DETECTED!*\n\nConsider rolling back immediately!' : ''}

Time: ${new Date().toLocaleString('ru-RU')}
  `;
  
  await bot.telegram.sendMessage(
    process.env.TELEGRAM_ADMIN_CHAT_ID,
    message,
    { parse_mode: 'Markdown' }
  );
  
  // Send to alert channel if configured
  if (process.env.TELEGRAM_ALERT_CHAT_ID && (results.failed > 0 || results.criticalFailures)) {
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_ALERT_CHAT_ID,
      `⚠️ E2E Tests: ${results.failed} failures detected\nSuccess rate: ${successRate}%`,
      { parse_mode: 'Markdown' }
    );
  }
}

module.exports = {
  scheduleE2ETests
};
