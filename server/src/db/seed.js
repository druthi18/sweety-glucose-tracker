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

  const demoPatientEmail = 'demo@sweety.test';
  const demoDoctorEmail = 'doctor@sweety.test';
  const demoPassword = 'Password123!';
  const demoPatientName = 'Eleanor Vance (Patient)';
  const demoDoctorName = 'Dr. Sarah Chen, MD (Endocrinology)';

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(demoPassword, salt);

  // 1. Check or create demo patient
  const userCheck = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [demoPatientEmail]);
  let patientId;

  if (userCheck.rows.length > 0) {
    patientId = userCheck.rows[0].id;
    console.log(`[Seed] Found existing demo patient with ID: ${patientId}`);
    await query('DELETE FROM readings WHERE user_id = $1', [patientId]);
  } else {
    const insertUser = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [demoPatientName, demoPatientEmail, passwordHash, 'patient']
    );
    patientId = insertUser.rows[0].id;
    console.log(`[Seed] Created new demo patient with ID: ${patientId}`);
  }

  // 2. Check or create demo doctor
  const docCheck = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [demoDoctorEmail]);
  let doctorId;

  if (docCheck.rows.length > 0) {
    doctorId = docCheck.rows[0].id;
    console.log(`[Seed] Found existing demo doctor with ID: ${doctorId}`);
  } else {
    const insertDoc = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [demoDoctorName, demoDoctorEmail, passwordHash, 'doctor']
    );
    doctorId = insertDoc.rows[0].id;
    console.log(`[Seed] Created new demo doctor with ID: ${doctorId}`);
  }

  // 3. Assign demo patient to demo doctor
  const assignCheck = await query(
    'SELECT id FROM doctor_patients WHERE doctor_id = $1 AND patient_id = $2',
    [doctorId, patientId]
  );
  if (assignCheck.rows.length === 0) {
    await query(
      'INSERT INTO doctor_patients (doctor_id, patient_id) VALUES ($1, $2)',
      [doctorId, patientId]
    );
    console.log(`[Seed] Assigned Patient #${patientId} to Doctor #${doctorId}`);
  }

  // 4. Generate realistic readings for the patient
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  const datesToSeed = [];

  // Previous month: all days
  const prevMonthDate = new Date(currentYear, currentMonth, 0);
  const prevMonthYear = prevMonthDate.getFullYear();
  const prevMonthIndex = prevMonthDate.getMonth();
  const daysInPrevMonth = prevMonthDate.getDate();

  for (let d = 1; d <= daysInPrevMonth; d++) {
    const date = new Date(prevMonthYear, prevMonthIndex, d);
    datesToSeed.push(formatDate(date));
  }

  // Current month: from 1st up to today
  for (let d = 1; d <= currentDay; d++) {
    const date = new Date(currentYear, currentMonth, d);
    datesToSeed.push(formatDate(date));
  }

  console.log(`[Seed] Generating readings for ${datesToSeed.length} days...`);

  let readingCount = 0;

  for (const dateStr of datesToSeed) {
    const isToday = dateStr === formatDate(now);
    // For today, populate 3 slots so user can try adding the 4th
    const slotsForDay = isToday ? SLOTS.slice(0, 3) : SLOTS;

    for (const slot of slotsForDay) {
      let glucoseValue;
      if (slot === 'Morning (fasting)') {
        glucoseValue = getRandomInt(85, 125);
      } else if (slot === 'After breakfast') {
        glucoseValue = getRandomInt(120, 175);
      } else if (slot === 'After lunch') {
        glucoseValue = getRandomInt(115, 165);
      } else {
        glucoseValue = getRandomInt(130, 190);
      }

      if (Math.random() < 0.05) {
        glucoseValue = getRandomInt(210, 260); // Spike
      } else if (Math.random() < 0.03) {
        glucoseValue = getRandomInt(65, 75); // Low
      }

      const exist = await query(
        `SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3`,
        [patientId, dateStr, slot]
      );

      if (exist.rows.length === 0) {
        await query(
          `INSERT INTO readings (user_id, reading_date, time_slot, glucose_value)
           VALUES ($1, $2, $3, $4)`,
          [patientId, dateStr, slot, glucoseValue]
        );
        readingCount++;
      }
    }
  }

  console.log(`[Seed] Seeded ${readingCount} blood glucose readings successfully!`);
  console.log('====================================================');
  console.log('Demo Accounts:');
  console.log('  1. Patient Account:');
  console.log(`     Email:    ${demoPatientEmail}`);
  console.log(`     Password: ${demoPassword}`);
  console.log('  2. Doctor Account:');
  console.log(`     Email:    ${demoDoctorEmail}`);
  console.log(`     Password: ${demoPassword}`);
  console.log('====================================================');
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
