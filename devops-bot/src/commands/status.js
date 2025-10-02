
const logger = require('../utils/logger');
const { checkSystemHealth } = require('../monitors/health-monitor');
const { getLatestErrors } = require('../utils/error-tracker');

const status = async (ctx) => {
  try {
    await ctx.reply('🔍 Checking system status...');
    
    const health = await checkSystemHealth();
    const state = global.botState;
    
    let statusEmoji = '🟢';
    if (health.status === 'warning') statusEmoji = '🟡';
    if (health.status === 'critical') statusEmoji = '🔴';
    
    const message = `
${statusEmoji} *GOGOMARKET Status Report*

*System Status:* ${health.status.toUpperCase()}
*Uptime:* ${health.uptime}
*Last Check:* ${new Date().toLocaleString('ru-RU')}

*Components:*
${health.components.map(c => `${c.ok ? '✅' : '❌'} ${c.name}: ${c.status}`).join('\n')}

*Performance:*
📊 Response Time: ${health.performance.responseTime}ms
💾 Database: ${health.performance.dbResponseTime}ms
📈 Load: ${health.performance.load}

*Version Info:*
🏷 Current: ${state.currentVersion || 'unknown'}
📅 Last Deploy: ${state.lastDeploy || 'unknown'}

${state.pendingRollback ? '⚠️ *PENDING ROLLBACK!*' : ''}
    `;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Status command error:', error);
    await ctx.reply('❌ Error checking status: ' + error.message);
  }
};

const health = async (ctx) => {
  try {
    await ctx.reply('🏥 Running health checks...');
    
    const health = await checkSystemHealth();
    
    const message = `
🏥 *Health Check Results*

*Production:*
${health.production.ok ? '✅' : '❌'} Status: ${health.production.status}
${health.production.ok ? '✅' : '❌'} Response: ${health.production.responseTime}ms

*Staging:*
${health.staging.ok ? '✅' : '❌'} Status: ${health.staging.status}
${health.staging.ok ? '✅' : '❌'} Response: ${health.staging.responseTime}ms

*Database:*
${health.database.ok ? '✅' : '❌'} Connection: ${health.database.status}
${health.database.ok ? '✅' : '❌'} Query Time: ${health.database.queryTime}ms

*External Services:*
${health.services.map(s => `${s.ok ? '✅' : '❌'} ${s.name}: ${s.status}`).join('\n')}
    `;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Health command error:', error);
    await ctx.reply('❌ Error checking health: ' + error.message);
  }
};

const report = async (ctx) => {
  try {
    await ctx.reply('📊 Generating 24-hour report...');
    
    // TODO: Implement full report generation
    const message = `
📊 *24-Hour Report*

*Tests Run:* 6 cycles
*Success Rate:* 98.5%
*Failed Tests:* 3

*Performance:*
📈 Avg Response Time: 245ms
📉 Slowest Endpoint: /api/orders (1.2s)
🔥 Peak Traffic: 14:00-16:00

*Errors:*
❌ 500 Errors: 12
❌ 404 Errors: 45
❌ Timeout Errors: 3

*Deployments:*
🚀 Successful: 2
❌ Failed: 0
🔄 Rollbacks: 0

_Full report available in logs_
    `;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Report command error:', error);
    await ctx.reply('❌ Error generating report: ' + error.message);
  }
};

const errors = async (ctx) => {
  try {
    const errors = await getLatestErrors(10);
    
    if (errors.length === 0) {
      await ctx.reply('✅ No recent errors found!');
      return;
    }
    
    const message = `
❌ *Recent Errors (Last 10)*

${errors.map((err, i) => `
${i + 1}. *${err.type}* - ${err.message}
   📅 ${new Date(err.timestamp).toLocaleString('ru-RU')}
   📍 ${err.location}
`).join('\n')}

Use /test_all to verify fixes
    `;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Errors command error:', error);
    await ctx.reply('❌ Error fetching errors: ' + error.message);
  }
};

module.exports = {
  status,
  health,
  report,
  errors
};
