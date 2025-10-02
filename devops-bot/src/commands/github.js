
const logger = require('../utils/logger');
const { getRecentCommits, getBranches, compareVersions, getCIStatus } = require('../github/api');

const commits = async (ctx) => {
  try {
    await ctx.reply('📝 Fetching recent commits...');
    
    const commits = await getRecentCommits(10);
    
    const message = `
📝 *Recent Commits (Last 10)*

${commits.map((commit, i) => `
${i + 1}. ${commit.message}
   👤 ${commit.author}
   📅 ${new Date(commit.date).toLocaleString('ru-RU')}
   🔗 \`${commit.sha.substring(0, 7)}\`
`).join('\n')}
    `;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Commits command error:', error);
    await ctx.reply('❌ Error fetching commits: ' + error.message);
  }
};

const branches = async (ctx) => {
  try {
    await ctx.reply('🌿 Fetching branches...');
    
    const branches = await getBranches();
    
    const message = `
🌿 *Repository Branches*

${branches.map(b => `${b.isDefault ? '⭐' : '•'} ${b.name}${b.protected ? ' 🔒' : ''}`).join('\n')}

⭐ Default branch
🔒 Protected
    `;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Branches command error:', error);
    await ctx.reply('❌ Error fetching branches: ' + error.message);
  }
};

const compare = async (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    
    if (args.length < 2) {
      await ctx.reply('Usage: /compare [base] [head]\n\nExample: /compare main feature/new-feature');
      return;
    }
    
    const [base, head] = args;
    await ctx.reply(`📊 Comparing ${base}...${head}`);
    
    const comparison = await compareVersions(base, head);
    
    const message = `
📊 *Version Comparison*

Base: ${base}
Head: ${head}

*Changes:*
📝 Commits: ${comparison.commits}
📁 Files Changed: ${comparison.filesChanged}
➕ Additions: ${comparison.additions}
➖ Deletions: ${comparison.deletions}

${comparison.commits > 0 ? `\n*Recent Commits:*\n${comparison.recentCommits.map(c => `• ${c.message}`).join('\n')}` : ''}
    `;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('Compare command error:', error);
    await ctx.reply('❌ Error comparing versions: ' + error.message);
  }
};

const ciStatus = async (ctx) => {
  try {
    await ctx.reply('🔄 Checking CI/CD status...');
    
    const status = await getCIStatus();
    
    const message = `
🔄 *CI/CD Status*

*Latest Workflow:*
${status.conclusion === 'success' ? '✅' : '❌'} ${status.name}
Status: ${status.status}
Conclusion: ${status.conclusion}
Branch: ${status.branch}

*Started:* ${new Date(status.startedAt).toLocaleString('ru-RU')}
*Duration:* ${status.duration}

${status.jobs ? `\n*Jobs:*\n${status.jobs.map(j => `${j.conclusion === 'success' ? '✅' : '❌'} ${j.name}`).join('\n')}` : ''}
    `;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error('CI Status command error:', error);
    await ctx.reply('❌ Error checking CI status: ' + error.message);
  }
};

module.exports = {
  commits,
  branches,
  compare,
  ciStatus
};
