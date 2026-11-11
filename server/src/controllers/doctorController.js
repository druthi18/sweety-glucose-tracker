const db = require('../config/db');
const { formatReadingRow } = require('./readingController');
const { getReports } = require('./reportController');

/**
 * Middleware: ensure the user has the 'doctor' role
 */
function requireDoctor(req, res, next) {
  if (req.user && req.user.role === 'doctor') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Doctor privileges required.' });
}

/**
 * Get all patients assigned to the logged-in doctor
 */
async function getAssignedPatients(req, res) {
  try {
    const doctorId = req.user.id;

    const patientListResult = await db.query(
      `SELECT u.id, u.name, u.email, u.created_at, dp.assigned_at
       FROM users u
       JOIN doctor_patients dp ON u.id = dp.patient_id
       WHERE dp.doctor_id = $1
       ORDER BY u.name ASC`,
      [doctorId]
    );

    const patients = [];
    for (const p of patientListResult.rows) {
      const statsRes = await db.query(
        `SELECT COUNT(*)::int AS total, AVG(glucose_value)::float AS avg_val
         FROM readings
         WHERE user_id = $1`,
        [p.id]
      );
      const total = parseInt(statsRes.rows[0].total, 10) || 0;
      const rawAvg = statsRes.rows[0].avg_val;
      const avg = total > 0 && rawAvg !== null ? Math.round(Number(rawAvg) * 10) / 10 : null;

      patients.push({
        ...p,
        total_readings: total,
        avg_glucose: avg
      });
    }

    return res.status(200).json({ patients });
  } catch (err) {
    console.error('[Doctor Controller] getAssignedPatients Error:', err);
    return res.status(500).json({ message: 'Server error retrieving assigned patients.' });
  }
}

/**
 * Get reports for an assigned patient
 */
async function getPatientReports(req, res) {
  try {
    const doctorId = req.user.id;
    const patientId = parseInt(req.params.patientId, 10);

    // Verify doctor is assigned to this patient
    const assignmentCheck = await db.query(
      `SELECT id FROM doctor_patients WHERE doctor_id = $1 AND patient_id = $2`,
      [doctorId, patientId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not assigned to this patient.' });
    }

    // Call reportController logic by mocking req.user.id to patientId
    req.user.id = patientId;
    return getReports(req, res);
  } catch (err) {
    console.error('[Doctor Controller] getPatientReports Error:', err);
    return res.status(500).json({ message: 'Server error retrieving patient reports.' });
  }
}

/**
 * Assign a patient to the doctor by email
 */
async function assignPatient(req, res) {
  try {
    const doctorId = req.user.id;
    const { patient_email } = req.body;

    if (!patient_email) {
      return res.status(400).json({ message: 'Patient email is required.' });
    }

    const patientRes = await db.query(
      `SELECT id, name, email, role FROM users WHERE LOWER(email) = LOWER($1)`,
      [patient_email.trim()]
    );

    if (patientRes.rows.length === 0) {
      return res.status(404).json({ message: 'No patient found with this email.' });
    }

    const patient = patientRes.rows[0];

    await db.query(
      `INSERT INTO doctor_patients (doctor_id, patient_id)
       VALUES ($1, $2)
       ON CONFLICT (doctor_id, patient_id) DO NOTHING`,
      [doctorId, patient.id]
    );

    return res.status(200).json({
      message: `Patient ${patient.name} assigned to your care list successfully.`,
      patient
    });
  } catch (err) {
    console.error('[Doctor Controller] assignPatient Error:', err);
    return res.status(500).json({ message: 'Server error assigning patient.' });
  }
}

module.exports = {
  requireDoctor,
  getAssignedPatients,
  getPatientReports,
  assignPatient
};
