const app = require('./app');
const { initializePool, query } = require('./config/db');
const { seed } = require('./db/seed');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const pool = initializePool();
    // Test database connection
    await pool.query('SELECT 1');
    console.log('[Server] Database connection established successfully.');

    // Auto-seed if database is fresh/empty
    try {
      const userCount = await query('SELECT COUNT(*)::int AS count FROM users');
      if (parseInt(userCount.rows[0].count, 10) === 0) {
        console.log('[Server] Fresh database detected. Auto-seeding demo patient...');
        await seed();
      }
    } catch (seedErr) {
      console.warn('[Server] Auto-seed skipped:', seedErr.message);
    }

    app.listen(PORT, () => {
      console.log(`[Server] Sweety API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to connect to database:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
