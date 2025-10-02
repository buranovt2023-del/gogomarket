
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

const ERROR_LOG_FILE = path.join(__dirname, '..', '..', 'logs', 'errors.json');

async function logError(error) {
  try {
    const errorData = {
      timestamp: Date.now(),
      type: error.type || 'unknown',
      message: error.message,
      location: error.location || 'unknown',
      stack: error.stack
    };
    
    // Read existing errors
    let errors = [];
    try {
      const data = await fs.readFile(ERROR_LOG_FILE, 'utf8');
      errors = JSON.parse(data);
    } catch (err) {
      // File doesn't exist or is empty
    }
    
    // Add new error
    errors.unshift(errorData);
    
    // Keep only last 100 errors
    errors = errors.slice(0, 100);
    
    // Write back
    await fs.writeFile(ERROR_LOG_FILE, JSON.stringify(errors, null, 2));
    
  } catch (err) {
    logger.error('Error tracking error:', err);
  }
}

async function getLatestErrors(limit = 10) {
  try {
    const data = await fs.readFile(ERROR_LOG_FILE, 'utf8');
    const errors = JSON.parse(data);
    return errors.slice(0, limit);
  } catch (err) {
    return [];
  }
}

async function clearErrors() {
  try {
    await fs.writeFile(ERROR_LOG_FILE, JSON.stringify([], null, 2));
  } catch (err) {
    logger.error('Error clearing errors:', err);
  }
}

module.exports = {
  logError,
  getLatestErrors,
  clearErrors
};
