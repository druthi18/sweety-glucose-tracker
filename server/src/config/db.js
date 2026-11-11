const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let pool = null;
let isInMemory = false;

const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');

function setupInMemoryDb() {
  const { newDb } = require('pg-mem');
  const db = newDb({
    autoCreateForeignKeyIndices: true
  });

  // Register common functions if needed
  db.public.registerFunction({
    name: 'now',
    returns: db.public.getType('timestamp with time zone'),
    implementation: () => new Date()
  });

  db.public.registerFunction({
    name: 'current_timestamp',
    returns: db.public.getType('timestamp with time zone'),
    implementation: () => new Date()
  });

  db.public.registerFunction({
    name: 'round',
    args: [db.public.getType('float'), db.public.getType('integer')],
    returns: db.public.getType('float'),
    implementation: (val, dec) => {
      if (val === null || val === undefined) return null;
      const factor = Math.pow(10, dec || 0);
      return Math.round(Number(val) * factor) / factor;
    }
  });

  // Execute schema
  db.public.none(schemaSql);

  const pg = db.adapters.createPg();
  isInMemory = true;
  return new pg.Pool();
}

function initializePool() {
  if (pool) return pool;

  const shouldUseInMemory = process.env.USE_PG_MEM === 'true' || process.env.NODE_ENV === 'test';

  if (shouldUseInMemory) {
    pool = setupInMemoryDb();
    console.log('[Database] Running with in-memory PostgreSQL engine (pg-mem)');
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;
  const config = connectionString
    ? { connectionString }
    : {
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'sweety_db'
      };

  pool = new Pool(config);

  pool.on('error', (err) => {
    console.error('[Database] Unexpected PostgreSQL error:', err);
  });

  return pool;
}

const query = async (text, params) => {
  const activePool = initializePool();
  return activePool.query(text, params);
};

const getClient = async () => {
  const activePool = initializePool();
  return activePool.connect();
};

const resetForTesting = async () => {
  if (pool) {
    try {
      await pool.end();
    } catch (_) {}
    pool = null;
  }
  pool = setupInMemoryDb();
  return pool;
};

module.exports = {
  initializePool,
  query,
  getClient,
  resetForTesting,
  isInMemory: () => isInMemory
};
