const express = require('express');
const {
  requireDoctor,
  getAssignedPatients,
  getPatientReports,
  assignPatient
} = require('../controllers/doctorController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All doctor routes require valid authentication & doctor role
router.use(authenticateToken);
router.use(requireDoctor);

router.get('/patients', getAssignedPatients);
router.get('/patients/:patientId/reports', getPatientReports);
router.post('/patients/assign', assignPatient);

module.exports = router;
