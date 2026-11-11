const fs = require('fs');
const path = require('path');
const { initializePool, query } = require('../config/db');

async function migrate() {
  console.log('[Migration] Running database schema migration...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  initializePool();
  await query(schemaSql);
  console.log('[Migration] Tables and constraints created successfully.');
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration] Failed:', err);
      process.exit(1);
    });
}

module.exports = { migrate };
