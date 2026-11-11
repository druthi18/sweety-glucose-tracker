const db = require('../config/db');
const { validateReadingInput, VALID_TIME_SLOTS } = require('../utils/validation');

/**
 * Format a reading row from DB ensuring reading_date is YYYY-MM-DD string.
 */
function formatReadingRow(row) {
  if (!row) return null;
  let formattedDate = row.reading_date;
  if (row.reading_date instanceof Date) {
    const year = row.reading_date.getFullYear();
    const month = String(row.reading_date.getMonth() + 1).padStart(2, '0');
    const day = String(row.reading_date.getDate()).padStart(2, '0');
    formattedDate = `${year}-${month}-${day}`;
  } else if (typeof row.reading_date === 'string') {
    formattedDate = row.reading_date.slice(0, 10);
  }
  return {
    ...row,
    reading_date: formattedDate,
    glucose_value: Number(row.glucose_value)
  };
}

/**
 * Add a new reading
 */
async function createReading(req, res) {
  try {
    const userId = req.user.id;
    const { reading_date, time_slot, glucose_value } = req.body;

    // 1. Basic input validations
    const validation = validateReadingInput({ reading_date, time_slot, glucose_value });
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.errors[0], errors: validation.errors });
    }

    const cleanDate = reading_date.trim().slice(0, 10);
    const cleanSlot = time_slot.trim();
    const intGlucose = parseInt(glucose_value, 10);

    // 2. Business validation: Maximum 4 readings per day
    const countCheck = await db.query(
      `SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2`,
      [userId, cleanDate]
    );

    const currentCount = parseInt(countCheck.rows[0].count, 10);
    if (currentCount >= 4) {
      return res.status(400).json({
        message: 'You can add only 4 readings per day.',
        rule: 'max_readings_exceeded'
      });
    }

    // 3. Business validation: Only one reading per slot per day
    const slotCheck = await db.query(
      `SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3`,
      [userId, cleanDate, cleanSlot]
    );

    if (slotCheck.rows.length > 0) {
      return res.status(400).json({
        message: `You already have an ${cleanSlot} reading for this date.`,
        rule: 'duplicate_slot'
      });
    }

    // 4. Insert reading
    const insertResult = await db.query(
      `INSERT INTO readings (user_id, reading_date, time_slot, glucose_value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, reading_date, time_slot, glucose_value, created_at, updated_at`,
      [userId, cleanDate, cleanSlot, intGlucose]
    );

    const reading = formatReadingRow(insertResult.rows[0]);
    return res.status(201).json({
      message: 'Reading recorded successfully.',
      reading
    });
  } catch (err) {
    console.error('[CreateReading Error]', err);
    // In case of unique constraint violation race condition
    if (err.code === '23505') {
      return res.status(400).json({
        message: `You already have an ${req.body.time_slot} reading for this date.`,
        rule: 'duplicate_slot'
      });
    }
    return res.status(500).json({ message: 'Server error saving reading.' });
  }
}

/**
 * Get readings with optional pagination and filters
 */
async function getReadings(req, res) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const { date, startDate, endDate, slot } = req.query;

    const conditions = ['user_id = $1'];
    const params = [userId];

    if (date) {
      params.push(date.trim().slice(0, 10));
      conditions.push(`reading_date = $${params.length}`);
    } else {
      if (startDate) {
        params.push(startDate.trim().slice(0, 10));
        conditions.push(`reading_date >= $${params.length}`);
      }
      if (endDate) {
        params.push(endDate.trim().slice(0, 10));
        conditions.push(`reading_date <= $${params.length}`);
      }
    }

    if (slot && VALID_TIME_SLOTS.includes(slot.trim())) {
      params.push(slot.trim());
      conditions.push(`time_slot = $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    // Total count query
    const totalResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM readings WHERE ${whereClause}`,
      params
    );
    const total = parseInt(totalResult.rows[0].total, 10);

    // Data query with ordering
    const queryParams = [...params, limit, offset];
    const dataResult = await db.query(
      `SELECT id, user_id, reading_date, time_slot, glucose_value, created_at, updated_at
       FROM readings
       WHERE ${whereClause}
       ORDER BY reading_date DESC,
         CASE time_slot
           WHEN 'Morning (fasting)' THEN 1
           WHEN 'After breakfast' THEN 2
           WHEN 'After lunch' THEN 3
           WHEN 'After dinner' THEN 4
           ELSE 5
         END ASC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    const readings = dataResult.rows.map(formatReadingRow);

    return res.status(200).json({
      readings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    console.error('[GetReadings Error]', err);
    return res.status(500).json({ message: 'Server error retrieving readings.' });
  }
}

/**
 * Get reading by ID
 */
async function getReadingById(req, res) {
  try {
    const userId = req.user.id;
    const readingId = parseInt(req.params.id, 10);

    const result = await db.query(
      `SELECT id, user_id, reading_date, time_slot, glucose_value, created_at, updated_at
       FROM readings
       WHERE id = $1 AND user_id = $2`,
      [readingId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reading not found.' });
    }

    return res.status(200).json({ reading: formatReadingRow(result.rows[0]) });
  } catch (err) {
    console.error('[GetReadingById Error]', err);
    return res.status(500).json({ message: 'Server error retrieving reading.' });
  }
}

/**
 * Edit reading
 */
async function updateReading(req, res) {
  try {
    const userId = req.user.id;
    const readingId = parseInt(req.params.id, 10);
    const { reading_date, time_slot, glucose_value } = req.body;

    // Check existence & ownership
    const existingResult = await db.query(
      `SELECT id, reading_date, time_slot FROM readings WHERE id = $1 AND user_id = $2`,
      [readingId, userId]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Reading not found.' });
    }

    // Validation
    const validation = validateReadingInput({ reading_date, time_slot, glucose_value });
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.errors[0], errors: validation.errors });
    }

    const cleanDate = reading_date.trim().slice(0, 10);
    const cleanSlot = time_slot.trim();
    const intGlucose = parseInt(glucose_value, 10);

    // Check duplicate slot if date or slot changed
    const duplicateCheck = await db.query(
      `SELECT id FROM readings
       WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3 AND id != $4`,
      [userId, cleanDate, cleanSlot, readingId]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        message: `You already have an ${cleanSlot} reading for this date.`,
        rule: 'duplicate_slot'
      });
    }

    // Update
    const updateResult = await db.query(
      `UPDATE readings
       SET reading_date = $1, time_slot = $2, glucose_value = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, reading_date, time_slot, glucose_value, created_at, updated_at`,
      [cleanDate, cleanSlot, intGlucose, readingId, userId]
    );

    const reading = formatReadingRow(updateResult.rows[0]);
    return res.status(200).json({
      message: 'Reading updated successfully.',
      reading
    });
  } catch (err) {
    console.error('[UpdateReading Error]', err);
    if (err.code === '23505') {
      return res.status(400).json({
        message: `You already have an ${req.body.time_slot} reading for this date.`,
        rule: 'duplicate_slot'
      });
    }
    return res.status(500).json({ message: 'Server error updating reading.' });
  }
}

/**
 * Delete reading
 */
async function deleteReading(req, res) {
  try {
    const userId = req.user.id;
    const readingId = parseInt(req.params.id, 10);

    const deleteResult = await db.query(
      `DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id`,
      [readingId, userId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Reading not found.' });
    }

    return res.status(200).json({ message: 'Reading deleted successfully.' });
  } catch (err) {
    console.error('[DeleteReading Error]', err);
    return res.status(500).json({ message: 'Server error deleting reading.' });
  }
}

module.exports = {
  createReading,
  getReadings,
  getReadingById,
  updateReading,
  deleteReading,
  formatReadingRow
};
