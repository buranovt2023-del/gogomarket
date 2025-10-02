
const { Client } = require('pg');
const logger = require('./logger');

async function checkDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  const startTime = Date.now();
  
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    
    const queryTime = Date.now() - startTime;
    
    return {
      ok: true,
      status: 'connected',
      queryTime: queryTime
    };
  } catch (error) {
    logger.error('Database check error:', error);
    return {
      ok: false,
      status: 'disconnected',
      error: error.message
    };
  }
}

module.exports = {
  checkDatabase
};
