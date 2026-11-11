const db = require('../config/db');
const { formatReadingRow } = require('./readingController');
const cacheService = require('../services/cacheService');

/**
 * Returns formatted friendly date (e.g., '15 Oct 2026')
 */
function formatFriendlyDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return dateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Returns month and year (e.g. 'Oct 2026')
 */
function formatMonthYear(year, month) {
  const dateObj = new Date(Date.UTC(year, month - 1, 1));
  return dateObj.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Helper to calculate stats for a given date range
 */
async function getStatsForRange(userId, startDate, endDate) {
  const query = `
    SELECT
      COUNT(*)::int AS count,
      MAX(glucose_value)::int AS highest,
      MIN(glucose_value)::int AS lowest,
      AVG(glucose_value)::float AS average_val
    FROM readings
    WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
  `;

  const result = await db.query(query, [userId, startDate, endDate]);
  const row = result.rows[0];

  const count = parseInt(row.count, 10) || 0;
  const average =
    count > 0 && row.average_val !== null && row.average_val !== undefined
      ? Math.round(Number(row.average_val) * 10) / 10
      : null;

  return {
    count,
    highest: count > 0 && row.highest !== null ? Number(row.highest) : null,
    lowest: count > 0 && row.lowest !== null ? Number(row.lowest) : null,
    average,
    hasData: count > 0
  };
}

/**
 * Get comprehensive reports (Daily, Month-to-date, Monthly) for selected date
 */
async function getReports(req, res) {
  try {
    const userId = req.user.id;
    let selectedDate = req.query.date;

    if (!selectedDate || typeof selectedDate !== 'string') {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      selectedDate = `${y}-${m}-${d}`;
    } else {
      selectedDate = selectedDate.trim().slice(0, 10);
    }

    const [yStr, mStr, dStr] = selectedDate.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);
    const day = parseInt(dStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return res.status(400).json({ message: 'Invalid date format. Expected YYYY-MM-DD.' });
    }

    // Check Cache
    const cacheKey = cacheService.generateKey(userId, selectedDate);
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json({ ...cachedData, cached: true });
    }

    // 1. Daily Report: The selected date
    const dailyStartDate = selectedDate;
    const dailyEndDate = selectedDate;
    const dailyStats = await getStatsForRange(userId, dailyStartDate, dailyEndDate);

    // Fetch daily readings with their slot
    const dailyReadingsResult = await db.query(
      `SELECT id, user_id, reading_date, time_slot, glucose_value, created_at, updated_at
       FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY
         CASE time_slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC`,
      [userId, selectedDate]
    );
    const dailyReadings = dailyReadingsResult.rows.map(formatReadingRow);

    // 2. Month-to-date: 1st of the month to selected date
    const mtdStartDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const mtdEndDate = selectedDate;
    const mtdStats = await getStatsForRange(userId, mtdStartDate, mtdEndDate);

    // 3. Monthly: The whole previous month
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 1) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    const prevLastDay = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
    const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`;
    const monthlyStats = await getStatsForRange(userId, prevStartDate, prevEndDate);

    // Optional series data for chart visualization over current month
    const seriesResult = await db.query(
      `SELECT id, reading_date, time_slot, glucose_value
       FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
       ORDER BY reading_date ASC,
         CASE time_slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC`,
      [userId, mtdStartDate, mtdEndDate]
    );

    const responsePayload = {
      selectedDate,
      daily: {
        title: 'Daily Report',
        dateRange: `${formatFriendlyDate(selectedDate)}`,
        startDate: dailyStartDate,
        endDate: dailyEndDate,
        ...dailyStats,
        readings: dailyReadings
      },
      monthToDate: {
        title: 'Month-to-Date Report',
        dateRange: `${formatFriendlyDate(mtdStartDate)} – ${formatFriendlyDate(mtdEndDate)}`,
        startDate: mtdStartDate,
        endDate: mtdEndDate,
        ...mtdStats
      },
      monthly: {
        title: 'Monthly Report (Previous Month)',
        dateRange: `${formatFriendlyDate(prevStartDate)} – ${formatFriendlyDate(prevEndDate)}`,
        startDate: prevStartDate,
        endDate: prevEndDate,
        ...monthlyStats
      },
      chartData: seriesResult.rows.map(formatReadingRow)
    };

    // Store in cache for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, responsePayload, 300);

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json({ ...responsePayload, cached: false });
  } catch (err) {
    console.error('[GetReports Error]', err);
    return res.status(500).json({ message: 'Server error generating reports.' });
  }
}

module.exports = {
  getReports,
  getStatsForRange,
  formatFriendlyDate
};
