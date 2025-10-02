
const logger = require('../utils/logger');
const statusCommand = require('./status');
const testCommands = require('./test');
const deployCommands = require('./deploy');
const githubCommands = require('./github');
const helpCommand = require('./help');

function initializeCommands(bot) {
  logger.info('Initializing bot commands...');

  // Help command
  bot.command('help', helpCommand);
  bot.command('start', helpCommand);

  // Status commands
  bot.command('status', statusCommand.status);
  bot.command('health', statusCommand.health);
  bot.command('report', statusCommand.report);
  bot.command('errors', statusCommand.errors);

  // Test commands
  bot.command('test_all', testCommands.testAll);
  bot.command('test_critical', testCommands.testCritical);
  bot.command('test', testCommands.testSpecific);

  // Deploy commands
  bot.command('deploy', deployCommands.deploy);
  bot.command('rollback', deployCommands.rollback);
  bot.command('maintenance', deployCommands.maintenance);

  // GitHub commands
  bot.command('commits', githubCommands.commits);
  bot.command('compare', githubCommands.compare);
  bot.command('ci_status', githubCommands.ciStatus);
  bot.command('branches', githubCommands.branches);

  // Callback query handlers for interactive buttons
  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    
    if (data.startsWith('rollback_')) {
      await handleRollbackCallback(ctx, data);
    } else if (data.startsWith('deploy_')) {
      await handleDeployCallback(ctx, data);
    } else if (data.startsWith('cancel_')) {
      await handleCancelCallback(ctx, data);
    }
  });

  logger.info('Bot commands initialized successfully');
}

async function handleRollbackCallback(ctx, data) {
  const action = data.split('_')[1];
  
  if (action === 'confirm') {
    await ctx.answerCbQuery('Rolling back...');
    await ctx.reply('🔄 Starting rollback process...');
    // Trigger rollback
    const deployCommands = require('./deploy');
    await deployCommands.executeRollback(ctx);
  } else if (action === 'cancel') {
    await ctx.answerCbQuery('Rollback cancelled');
    await ctx.editMessageText('❌ Rollback cancelled by admin');
    global.botState.pendingRollback = null;
  }
}

async function handleDeployCallback(ctx, data) {
  await ctx.answerCbQuery('Processing...');
  // Handle deployment callbacks
}

async function handleCancelCallback(ctx, data) {
  await ctx.answerCbQuery('Cancelled');
  await ctx.editMessageText('❌ Action cancelled');
}

module.exports = { initializeCommands };
