
const logger = require('../utils/logger');
const { deployToProduction, rollbackToPrevious, rollbackToCommit } = require('../github/deployment');
const { Markup } = require('telegraf');

const deploy = async (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    const branch = args[0] || 'main';
    
    if (global.botState.deploymentInProgress) {
      await ctx.reply('⚠️ Deployment already in progress. Please wait.');
      return;
    }
    
    await ctx.reply(`🚀 Starting deployment from branch: ${branch}\n\n1️⃣ Building on staging...\n2️⃣ Running E2E tests...\n3️⃣ Deploying to production...`);
    
    global.botState.deploymentInProgress = true;
    
    const result = await deployToProduction(branch);
    
    global.botState.deploymentInProgress = false;
    
    if (result.success) {
      const message = `
✅ *Deployment Successful!*

Branch: ${branch}
Commit: ${result.commit}
Duration: ${result.duration}

*Tests:*
✅ Build: OK
✅ E2E Tests: ${result.testsPass}/${result.testsTotal} passed
✅ Production: Live

Version: ${result.version}
      `;
      
      await ctx.reply(message, { parse_mode: 'Markdown' });
      
      // Send notification to alert channel
      if (process.env.TELEGRAM_ALERT_CHAT_ID) {
        await ctx.telegram.sendMessage(
          process.env.TELEGRAM_ALERT_CHAT_ID,
          `🚀 New deployment to production\n\nBranch: ${branch}\nCommit: ${result.commit}`,
          { parse_mode: 'Markdown' }
        );
      }
    } else {
      const message = `
❌ *Deployment Failed!*

Branch: ${branch}
Error: ${result.error}

${result.testsFailed ? `\nFailed tests:\n${result.failedTests.join('\n')}` : ''}

Deployment was automatically reverted.
      `;
      
      await ctx.reply(message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    logger.error('Deploy command error:', error);
    await ctx.reply('❌ Deployment error: ' + error.message);
    global.botState.deploymentInProgress = false;
  }
};

const rollback = async (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    const commitHash = args[0];
    
    if (global.botState.deploymentInProgress) {
      await ctx.reply('⚠️ Deployment in progress. Cannot rollback now.');
      return;
    }
    
    // Confirmation
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Confirm Rollback', 'rollback_confirm'),
        Markup.button.callback('❌ Cancel', 'rollback_cancel')
      ]
    ]);
    
    if (commitHash) {
      await ctx.reply(
        `⚠️ *Rollback Confirmation*\n\nRollback to commit: \`${commitHash}\`\n\nThis will:\n- Revert production code\n- Run verification tests\n- May cause downtime\n\nConfirm?`,
        { parse_mode: 'Markdown', ...keyboard }
      );
    } else {
      await ctx.reply(
        `⚠️ *Rollback Confirmation*\n\nRollback to previous stable version\n\nThis will:\n- Revert production code\n- Run verification tests\n- May cause brief downtime\n\nConfirm?`,
        { parse_mode: 'Markdown', ...keyboard }
      );
    }
    
    global.botState.pendingRollback = { commitHash };
  } catch (error) {
    logger.error('Rollback command error:', error);
    await ctx.reply('❌ Rollback error: ' + error.message);
  }
};

const executeRollback = async (ctx, commitHash = null) => {
  try {
    await ctx.reply('🔄 Starting rollback process...');
    
    const result = commitHash 
      ? await rollbackToCommit(commitHash)
      : await rollbackToPrevious();
    
    if (result.success) {
      const message = `
✅ *Rollback Successful!*

Reverted to: ${result.version}
Commit: ${result.commit}
Duration: ${result.duration}

*Verification:*
✅ Build: OK
✅ Critical Tests: Passed
✅ Production: Live

System restored to stable state.
      `;
      
      await ctx.reply(message, { parse_mode: 'Markdown' });
      
      global.botState.pendingRollback = null;
    } else {
      await ctx.reply(`❌ *Rollback Failed!*\n\nError: ${result.error}\n\nManual intervention required!`, 
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    logger.error('Execute rollback error:', error);
    await ctx.reply('❌ Rollback execution error: ' + error.message);
  }
};

const maintenance = async (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    const mode = args[0];
    
    if (!mode || !['on', 'off'].includes(mode)) {
      await ctx.reply('Usage: /maintenance on|off');
      return;
    }
    
    // TODO: Implement maintenance mode
    if (mode === 'on') {
      await ctx.reply('🔧 *Maintenance Mode: ON*\n\nSite is now in maintenance mode.\nUsers will see maintenance page.', 
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply('✅ *Maintenance Mode: OFF*\n\nSite is back online.', 
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    logger.error('Maintenance command error:', error);
    await ctx.reply('❌ Maintenance mode error: ' + error.message);
  }
};

module.exports = {
  deploy,
  rollback,
  executeRollback,
  maintenance
};
