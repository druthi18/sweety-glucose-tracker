const bcrypt = require('bcryptjs');
const { initializePool, query } = require('../config/db');
const { migrate } = require('./migrate');

const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function seed() {
  console.log('[Seed] Seeding database with demo data...');

  // Ensure tables exist
  await migrate();

  initializePool();

  const demoEmail = 'demo@sweety.test';
  const demoPassword = 'Password123!';
  const demoName = 'Eleanor Vance (Patient)';

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(demoPassword, salt);

  // Check or create demo user
  const userCheck = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [demoEmail]);
  let userId;

  if (userCheck.rows.length > 0) {
    userId = userCheck.rows[0].id;
    console.log(`[Seed] Found existing demo user with ID: ${userId}`);
    // Clear existing readings for clean seed
    await query('DELETE FROM readings WHERE user_id = $1', [userId]);
  } else {
    const insertUser = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [demoName, demoEmail, passwordHash]
    );
    userId = insertUser.rows[0].id;
    console.log(`[Seed] Created new demo user with ID: ${userId}`);
  }

  // Generate realistic readings
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDay = now.getDate();

  const datesToSeed = [];

  // 1. Previous month: all days
  const prevMonthDate = new Date(currentYear, currentMonth, 0); // last day of prev month
  const prevMonthYear = prevMonthDate.getFullYear();
  const prevMonthIndex = prevMonthDate.getMonth();
  const daysInPrevMonth = prevMonthDate.getDate();

  for (let d = 1; d <= daysInPrevMonth; d++) {
    const date = new Date(prevMonthYear, prevMonthIndex, d);
    datesToSeed.push(formatDate(date));
  }

  // 2. Current month: from 1st up to today
  for (let d = 1; d <= currentDay; d++) {
    const date = new Date(currentYear, currentMonth, d);
    datesToSeed.push(formatDate(date));
  }

  console.log(`[Seed] Generating readings for ${datesToSeed.length} days...`);

  let readingCount = 0;

  for (const dateStr of datesToSeed) {
    const isToday = dateStr === formatDate(now);
    // For today, populate up to 3 or 4 slots so user can add remaining slot
    const slotsForDay = isToday ? SLOTS.slice(0, 3) : SLOTS;

    for (const slot of slotsForDay) {
      let glucoseValue;
      if (slot === 'Morning (fasting)') {
        // Normal fasting 70-99, slightly elevated 100-130
        glucoseValue = getRandomInt(85, 125);
      } else if (slot === 'After breakfast') {
        glucoseValue = getRandomInt(120, 175);
      } else if (slot === 'After lunch') {
        glucoseValue = getRandomInt(115, 165);
      } else {
        // After dinner
        glucoseValue = getRandomInt(130, 190);
      }

      // Add a couple intentional edge values for variance
      if (Math.random() < 0.05) {
        glucoseValue = getRandomInt(210, 260); // High spike
      } else if (Math.random() < 0.03) {
        glucoseValue = getRandomInt(65, 75); // Mild low
      }

      await query(
        `INSERT INTO readings (user_id, reading_date, time_slot, glucose_value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, reading_date, time_slot) DO NOTHING`,
        [userId, dateStr, slot, glucoseValue]
      );
      readingCount++;
    }
  }

  console.log(`[Seed] Seeded ${readingCount} blood glucose readings successfully!`);
  console.log('----------------------------------------------------');
  console.log('Demo Account Credentials:');
  console.log(`  Email:    ${demoEmail}`);
  console.log(`  Password: ${demoPassword}`);
  console.log('----------------------------------------------------');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Error:', err);
      process.exit(1);
    });
}

module.exports = { seed };
