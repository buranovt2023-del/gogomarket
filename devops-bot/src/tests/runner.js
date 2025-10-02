
const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../utils/logger');
const path = require('path');

const execAsync = promisify(exec);

async function runE2ETests(type = 'all', testName = null) {
  logger.info(`Running E2E tests: ${type}`);
  
  const startTime = Date.now();
  const testsDir = path.join(__dirname, '..', '..', 'tests', 'e2e');
  
  try {
    let command;
    
    if (type === 'all') {
      command = 'npx playwright test';
    } else if (type === 'critical') {
      command = 'npx playwright test --grep @critical';
    } else if (type === 'specific' && testName) {
      command = `npx playwright test --grep "${testName}"`;
    } else {
      throw new Error('Invalid test type');
    }
    
    // Run tests
    const { stdout, stderr } = await execAsync(command, {
      cwd: path.join(__dirname, '..', '..'),
      env: {
        ...process.env,
        BASE_URL: process.env.STAGING_URL || process.env.PRODUCTION_URL
      },
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    // Parse results
    const results = parseTestResults(stdout, type);
    results.duration = `${duration}s`;
    
    global.botState.lastTestResults = results;
    
    logger.info(`E2E tests completed: ${results.passed}/${results.total} passed`);
    return results;
    
  } catch (error) {
    logger.error('E2E tests error:', error);
    
    // Parse error output
    const duration = Math.round((Date.now() - startTime) / 1000);
    const results = parseTestResults(error.stdout || '', type);
    results.duration = `${duration}s`;
    results.error = error.message;
    
    return results;
  }
}

function parseTestResults(output, type) {
  // This is a simplified parser - real implementation would parse Playwright's JSON report
  const results = {
    type,
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    categories: [],
    failedTests: [],
    criticalFailures: false
  };
  
  // Parse output (simplified - real implementation would use Playwright's reporter)
  const lines = output.split('\n');
  
  lines.forEach(line => {
    if (line.includes('passed')) {
      const match = line.match(/(\d+) passed/);
      if (match) results.passed = parseInt(match[1]);
    }
    if (line.includes('failed')) {
      const match = line.match(/(\d+) failed/);
      if (match) results.failed = parseInt(match[1]);
    }
    if (line.includes('skipped')) {
      const match = line.match(/(\d+) skipped/);
      if (match) results.skipped = parseInt(match[1]);
    }
  });
  
  results.total = results.passed + results.failed + results.skipped;
  
  // Mock categories (real implementation would track these during tests)
  if (type === 'all') {
    results.categories = [
      { name: 'Client/Buyer', passed: Math.floor(results.passed * 0.4), total: Math.floor(results.total * 0.4), ok: true },
      { name: 'Seller', passed: Math.floor(results.passed * 0.3), total: Math.floor(results.total * 0.3), ok: true },
      { name: 'Courier', passed: Math.floor(results.passed * 0.2), total: Math.floor(results.total * 0.2), ok: true },
      { name: 'Admin', passed: Math.floor(results.passed * 0.1), total: Math.floor(results.total * 0.1), ok: true }
    ];
  }
  
  // Check for critical failures
  if (results.failed > 0 && type === 'critical') {
    results.criticalFailures = true;
  }
  
  return results;
}

module.exports = {
  runE2ETests
};
