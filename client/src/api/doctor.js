import { apiRequest } from './client';

export async function getDoctorPatientsApi() {
  return apiRequest('/doctor/patients', {
    method: 'GET'
  });
}

export async function getPatientReportsApi(patientId, date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiRequest(`/doctor/patients/${patientId}/reports${query}`, {
    method: 'GET'
  });
}

export async function assignPatientApi(patientEmail) {
  return apiRequest('/doctor/patients/assign', {
    method: 'POST',
    body: JSON.stringify({ patient_email: patientEmail })
  });
}
