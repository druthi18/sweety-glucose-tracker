const app = require('./app');
const { initializePool } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const pool = initializePool();
    // Test database connection
    await pool.query('SELECT 1');
    console.log('[Server] Database connection established successfully.');

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
