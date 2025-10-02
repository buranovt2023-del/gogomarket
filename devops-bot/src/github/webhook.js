
const crypto = require('crypto');
const logger = require('../utils/logger');

function initializeGitHubWebhook(app, bot) {
  logger.info('Initializing GitHub webhook...');
  
  // Webhook endpoint
  app.post('/webhook/github', async (req, res) => {
    try {
      // Verify webhook signature
      const signature = req.headers['x-hub-signature-256'];
      const payload = JSON.stringify(req.body);
      
      if (!verifySignature(payload, signature)) {
        logger.warn('Invalid webhook signature');
        return res.status(401).send('Invalid signature');
      }
      
      const event = req.headers['x-github-event'];
      
      logger.info(`Received GitHub webhook: ${event}`);
      
      // Handle different events
      if (event === 'push') {
        await handlePushEvent(req.body, bot);
      } else if (event === 'pull_request') {
        await handlePullRequestEvent(req.body, bot);
      } else if (event === 'workflow_run') {
        await handleWorkflowRunEvent(req.body, bot);
      }
      
      res.status(200).send('OK');
    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(500).send('Internal server error');
    }
  });
  
  logger.info('GitHub webhook initialized at /webhook/github');
}

function verifySignature(payload, signature) {
  if (!process.env.GITHUB_WEBHOOK_SECRET) {
    logger.warn('GITHUB_WEBHOOK_SECRET not set, skipping signature verification');
    return true;
  }
  
  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

async function handlePushEvent(payload, bot) {
  const branch = payload.ref.replace('refs/heads/', '');
  const commits = payload.commits;
  const pusher = payload.pusher.name;
  
  const message = `
📝 *New Push to ${branch}*

👤 By: ${pusher}
📦 Commits: ${commits.length}

${commits.slice(0, 3).map(c => `• ${c.message}`).join('\n')}
${commits.length > 3 ? `... and ${commits.length - 3} more` : ''}

${branch === 'main' ? '\n🚀 Auto-deployment will start shortly...' : ''}
  `;
  
  await bot.telegram.sendMessage(
    process.env.TELEGRAM_ADMIN_CHAT_ID,
    message,
    { parse_mode: 'Markdown' }
  );
}

async function handlePullRequestEvent(payload, bot) {
  const action = payload.action;
  const pr = payload.pull_request;
  
  if (action === 'opened') {
    const message = `
🔀 *New Pull Request*

#${pr.number}: ${pr.title}
👤 By: ${pr.user.login}
🌿 ${pr.head.ref} → ${pr.base.ref}

${pr.body ? pr.body.substring(0, 200) : ''}
    `;
    
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_ADMIN_CHAT_ID,
      message,
      { parse_mode: 'Markdown' }
    );
  } else if (action === 'closed' && pr.merged) {
    const message = `
✅ *Pull Request Merged*

#${pr.number}: ${pr.title}
🌿 ${pr.head.ref} → ${pr.base.ref}

${pr.base.ref === 'main' ? '🚀 Auto-deployment will start...' : ''}
    `;
    
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_ADMIN_CHAT_ID,
      message,
      { parse_mode: 'Markdown' }
    );
  }
}

async function handleWorkflowRunEvent(payload, bot) {
  const workflow = payload.workflow_run;
  const conclusion = workflow.conclusion;
  
  if (conclusion === 'failure') {
    const message = `
❌ *CI/CD Workflow Failed*

Workflow: ${workflow.name}
Branch: ${workflow.head_branch}
Triggered by: ${workflow.actor.login}

Check logs: ${workflow.html_url}
    `;
    
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_ADMIN_CHAT_ID,
      message,
      { parse_mode: 'Markdown' }
    );
  } else if (conclusion === 'success' && workflow.name.includes('production')) {
    const message = `
✅ *Production Deployment Complete*

Workflow: ${workflow.name}
Branch: ${workflow.head_branch}

System is now live with latest changes.
    `;
    
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_ADMIN_CHAT_ID,
      message,
      { parse_mode: 'Markdown' }
    );
  }
}

module.exports = {
  initializeGitHubWebhook
};
