
const { Telegraf } = require('telegraf');
const cron = require('node-cron');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const { initializeCommands } = require('./commands');
const { startMonitoring } = require('./monitors/health-monitor');
const { scheduleE2ETests } = require('./tests/scheduler');
const { initializeGitHubWebhook } = require('./github/webhook');
const express = require('express');

dotenv.config();

// Validate environment variables
const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_ADMIN_CHAT_ID',
  'GITHUB_TOKEN',
  'PRODUCTION_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Initialize Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Global state
global.botState = {
  lastTestResults: null,
  currentVersion: null,
  systemStatus: 'unknown',
  pendingRollback: null,
  deploymentInProgress: false
};

// Initialize commands
initializeCommands(bot);

// Start monitoring
startMonitoring(bot);

// Schedule E2E tests (every 4 hours)
scheduleE2ETests(bot);

// Express server for GitHub webhooks
const app = express();
app.use(express.json());

initializeGitHubWebhook(app, bot);

const PORT = process.env.WEBHOOK_PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Webhook server listening on port ${PORT}`);
});

// Bot startup
bot.launch()
  .then(() => {
    logger.info('🤖 GOGOMARKET DevOps Bot started successfully!');
    
    // Send startup message to admin
    bot.telegram.sendMessage(
      process.env.TELEGRAM_ADMIN_CHAT_ID,
      '🤖 *DevOps Bot Online*\n\n' +
      '✅ Monitoring started\n' +
      '✅ E2E tests scheduled (every 4 hours)\n' +
      '✅ GitHub webhook ready\n' +
      '✅ Auto-rollback enabled\n\n' +
      'Use /help to see available commands.',
      { parse_mode: 'Markdown' }
    );
  })
  .catch(err => {
    logger.error('Failed to start bot:', err);
    process.exit(1);
  });

// Graceful shutdown
process.once('SIGINT', () => {
  logger.info('SIGINT received, stopping bot...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  logger.info('SIGTERM received, stopping bot...');
  bot.stop('SIGTERM');
});

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = bot;
