const db = require('../config/db');

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks all active patients and generates reminder alerts for those with < 4 readings today.
 */
async function runDailyReminderCheck() {
  const today = getTodayString();
  console.log(`[Daily Reminder Job] Running reminder audit for date: ${today}`);

  try {
    const patientsRes = await db.query(
      `SELECT id, name, email FROM users WHERE role = 'patient' OR role IS NULL ORDER BY name ASC`
    );

    const logs = [];
    for (const patient of patientsRes.rows) {
      const countRes = await db.query(
        `SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2`,
        [patient.id, today]
      );
      const count = parseInt(countRes.rows[0].count, 10) || 0;

      if (count < 4) {
        const remaining = 4 - count;
        const logMessage = `[Reminder Sent] Patient ${patient.name} (${patient.email}) has logged ${count}/4 readings today. (${remaining} slots pending: morning, breakfast, lunch, or dinner).`;
        console.log(logMessage);
        logs.push({
          userId: patient.id,
          name: patient.name,
          email: patient.email,
          recordedToday: count,
          pendingSlots: remaining,
          timestamp: new Date().toISOString()
        });
      }
    }

    return {
      status: 'completed',
      date: today,
      totalAudited: patientsRes.rows.length,
      remindedCount: logs.length,
      reminders: logs
    };
  } catch (err) {
    console.error('[Daily Reminder Job] Error:', err);
    throw err;
  }
}

module.exports = {
  runDailyReminderCheck,
  getTodayString
};
