const { Pool } = require('pg');

// Use real PostgreSQL if env vars are set, otherwise fall back to mock
const hasRealDb = process.env.DB_HOST && process.env.DB_HOST !== '';

let pool;

if (hasRealDb) {
  pool = new Pool({
    host: process.env.DB_HOST || '172.18.0.3',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'jacknemo_dev',
    user: process.env.DB_USER || 'jackuser',
    password: process.env.DB_PASSWORD || 'jackdb_secure_2026',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  pool.on('error', (err) => console.error('PG pool error:', err.message));
  console.log('Database: PostgreSQL at', process.env.DB_HOST || '172.18.0.3');
} else {
  pool = require('./database-mock');
  console.log('Database: mock (no DB_HOST set)');
}

module.exports = pool;
