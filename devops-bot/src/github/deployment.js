
const logger = require('../utils/logger');
const { getRecentCommits, triggerWorkflow } = require('./api');
const { runE2ETests } = require('../tests/runner');

async function deployToProduction(branch = 'main') {
  logger.info(`Starting deployment from branch: ${branch}`);
  
  const startTime = Date.now();
  
  try {
    // 1. Trigger GitHub Actions deployment workflow
    logger.info('Triggering deployment workflow...');
    await triggerWorkflow('deploy-production.yml', branch);
    
    // 2. Wait for deployment to complete (simplified - should poll workflow status)
    await sleep(30000); // Wait 30 seconds
    
    // 3. Run E2E tests on staging first
    if (process.env.STAGING_TESTS_REQUIRED === 'true') {
      logger.info('Running E2E tests on staging...');
      const stagingTests = await runE2ETests('all');
      
      if (stagingTests.failed > 0 || stagingTests.criticalFailures) {
        logger.error('Staging tests failed, aborting deployment');
        return {
          success: false,
          error: 'Staging tests failed',
          testsFailed: true,
          failedTests: stagingTests.failedTests
        };
      }
    }
    
    // 4. Deploy to production (GitHub Actions handles this)
    logger.info('Deploying to production...');
    await sleep(60000); // Wait for deployment
    
    // 5. Verify production with critical tests
    logger.info('Verifying production deployment...');
    const prodTests = await runE2ETests('critical');
    
    if (prodTests.failed > 0) {
      logger.error('Production verification failed, rolling back');
      await rollbackToPrevious();
      return {
        success: false,
        error: 'Production verification failed',
        testsFailed: true,
        failedTests: prodTests.failedTests
      };
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    // Get commit info
    const commits = await getRecentCommits(1);
    const latestCommit = commits[0];
    
    return {
      success: true,
      commit: latestCommit.sha.substring(0, 7),
      version: latestCommit.sha.substring(0, 7),
      duration: `${duration}s`,
      testsPass: prodTests.passed,
      testsTotal: prodTests.total
    };
    
  } catch (error) {
    logger.error('Deployment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function rollbackToPrevious() {
  logger.info('Rolling back to previous version...');
  
  try {
    // Get previous commit
    const commits = await getRecentCommits(2);
    const previousCommit = commits[1]; // Second commit is previous
    
    return await rollbackToCommit(previousCommit.sha);
  } catch (error) {
    logger.error('Rollback error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function rollbackToCommit(commitHash) {
  logger.info(`Rolling back to commit: ${commitHash}`);
  
  const startTime = Date.now();
  
  try {
    // 1. Trigger rollback workflow (or revert commit and redeploy)
    await triggerWorkflow('deploy-production.yml', commitHash);
    
    // 2. Wait for rollback to complete
    await sleep(60000);
    
    // 3. Verify with critical tests
    const tests = await runE2ETests('critical');
    
    if (tests.failed > 0) {
      logger.error('Rollback verification failed');
      return {
        success: false,
        error: 'Rollback verification failed - system may be in unstable state'
      };
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    return {
      success: true,
      commit: commitHash.substring(0, 7),
      version: commitHash.substring(0, 7),
      duration: `${duration}s`
    };
    
  } catch (error) {
    logger.error('Rollback error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  deployToProduction,
  rollbackToPrevious,
  rollbackToCommit
};
