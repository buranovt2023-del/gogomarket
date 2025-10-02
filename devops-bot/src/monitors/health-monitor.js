
const axios = require('axios');
const cron = require('node-cron');
const logger = require('../utils/logger');

let bot = null;

async function checkSystemHealth() {
  logger.info('Running system health check...');
  
  const results = {
    status: 'ok',
    uptime: process.uptime(),
    components: [],
    performance: {},
    production: {},
    staging: {},
    database: {},
    services: []
  };
  
  try {
    // Check production
    const prodStart = Date.now();
    try {
      const prodResponse = await axios.get(process.env.PRODUCTION_URL + '/api/health', {
        timeout: 5000
      });
      results.production = {
        ok: prodResponse.status === 200,
        status: 'online',
        responseTime: Date.now() - prodStart
      };
      results.components.push({ name: 'Production', ok: true, status: 'online' });
    } catch (error) {
      results.production = {
        ok: false,
        status: 'offline',
        error: error.message
      };
      results.components.push({ name: 'Production', ok: false, status: 'offline' });
      results.status = 'critical';
    }
    
    // Check staging
    if (process.env.STAGING_URL) {
      const stagingStart = Date.now();
      try {
        const stagingResponse = await axios.get(process.env.STAGING_URL + '/api/health', {
          timeout: 5000
        });
        results.staging = {
          ok: stagingResponse.status === 200,
          status: 'online',
          responseTime: Date.now() - stagingStart
        };
        results.components.push({ name: 'Staging', ok: true, status: 'online' });
      } catch (error) {
        results.staging = {
          ok: false,
          status: 'offline',
          error: error.message
        };
        results.components.push({ name: 'Staging', ok: false, status: 'offline' });
      }
    }
    
    // Check database
    const { checkDatabase } = require('../utils/database');
    const dbResult = await checkDatabase();
    results.database = dbResult;
    results.components.push({ 
      name: 'Database', 
      ok: dbResult.ok, 
      status: dbResult.ok ? 'connected' : 'disconnected' 
    });
    
    if (!dbResult.ok) {
      results.status = 'critical';
    }
    
    // Performance metrics
    results.performance = {
      responseTime: results.production.responseTime || 0,
      dbResponseTime: dbResult.queryTime || 0,
      load: (Math.random() * 100).toFixed(1) + '%' // TODO: Get real load
    };
    
    // Check if response time is critical
    const criticalTime = parseInt(process.env.CRITICAL_RESPONSE_TIME_MS || 3000);
    if (results.production.responseTime > criticalTime) {
      results.status = 'warning';
    }
    
  } catch (error) {
    logger.error('Health check error:', error);
    results.status = 'critical';
    results.error = error.message;
  }
  
  global.botState.systemStatus = results.status;
  return results;
}

async function startMonitoring(botInstance) {
  bot = botInstance;
  logger.info('Starting health monitoring...');
  
  // Check every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const health = await checkSystemHealth();
      
      if (health.status === 'critical') {
        await sendCriticalAlert(health);
      } else if (health.status === 'warning') {
        await sendWarningAlert(health);
      }
    } catch (error) {
      logger.error('Monitoring error:', error);
    }
  });
  
  logger.info('Health monitoring started (every 5 minutes)');
}

async function sendCriticalAlert(health) {
  const message = `
🚨 *CRITICAL ALERT!*

${!health.production.ok ? '❌ *PRODUCTION IS DOWN!*\n' : ''}
${!health.database.ok ? '❌ *DATABASE CONNECTION FAILED!*\n' : ''}

Time: ${new Date().toLocaleString('ru-RU')}

${!health.production.ok ? `Production Error: ${health.production.error}\n` : ''}
${!health.database.ok ? `Database Error: ${health.database.error}\n` : ''}

⚠️ *Auto-rollback will trigger in 1 hour if not resolved*

Actions:
/status - Check full status
/rollback - Rollback now
/test_critical - Run critical tests
  `;
  
  try {
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_ADMIN_CHAT_ID,
      message,
      { parse_mode: 'Markdown' }
    );
    
    // Set rollback timer
    if (process.env.AUTO_ROLLBACK_ENABLED === 'true') {
      scheduleAutoRollback();
    }
  } catch (error) {
    logger.error('Failed to send critical alert:', error);
  }
}

async function sendWarningAlert(health) {
  const message = `
⚠️ *Warning Alert*

${health.performance.responseTime > 3000 ? `⚠️ Slow response time: ${health.performance.responseTime}ms\n` : ''}

Time: ${new Date().toLocaleString('ru-RU')}

System is still operational but performance degraded.
  `;
  
  try {
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_ADMIN_CHAT_ID,
      message,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    logger.error('Failed to send warning alert:', error);
  }
}

function scheduleAutoRollback() {
  if (global.botState.pendingRollback) {
    logger.info('Rollback already scheduled');
    return;
  }
  
  logger.info('Scheduling auto-rollback in 1 hour...');
  
  const rollbackTimeout = setTimeout(async () => {
    logger.warn('Executing auto-rollback after timeout...');
    
    const message = `
🔄 *AUTO-ROLLBACK TRIGGERED*

No response from admin within 1 hour.
Initiating automatic rollback to last stable version...
    `;
    
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_ADMIN_CHAT_ID,
      message,
      { parse_mode: 'Markdown' }
    );
    
    const { rollbackToPrevious } = require('../github/deployment');
    const result = await rollbackToPrevious();
    
    if (result.success) {
      await bot.telegram.sendMessage(
        process.env.TELEGRAM_ADMIN_CHAT_ID,
        '✅ Auto-rollback completed successfully!\n\nSystem restored to stable state.',
        { parse_mode: 'Markdown' }
      );
    } else {
      await bot.telegram.sendMessage(
        process.env.TELEGRAM_ADMIN_CHAT_ID,
        `❌ Auto-rollback failed!\n\nError: ${result.error}\n\n⚠️ MANUAL INTERVENTION REQUIRED!`,
        { parse_mode: 'Markdown' }
      );
    }
    
    global.botState.pendingRollback = null;
  }, 60 * 60 * 1000); // 1 hour
  
  global.botState.pendingRollback = {
    timeout: rollbackTimeout,
    scheduledAt: Date.now()
  };
}

module.exports = {
  checkSystemHealth,
  startMonitoring
};
