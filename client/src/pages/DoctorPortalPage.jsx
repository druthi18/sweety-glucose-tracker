import React, { useState, useEffect } from 'react';
import { getDoctorPatientsApi, getPatientReportsApi, assignPatientApi } from '../api/doctor';
import ReportSummaryCard from '../components/ReportSummaryCard';
import GlucoseTrendChart from '../components/GlucoseTrendChart';
import {
  Stethoscope,
  Users,
  Calendar,
  AlertCircle,
  Plus,
  Search,
  Activity,
  CheckCircle2,
  FileText
} from 'lucide-react';

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DoctorPortalPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientReports, setPatientReports] = useState(null);
  const [anchorDate, setAnchorDate] = useState(getTodayString());
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [error, setError] = useState('');
  const [assignEmail, setAssignEmail] = useState('');
  const [assignMsg, setAssignMsg] = useState('');
  const [assignError, setAssignError] = useState('');

  // 1. Fetch assigned patients
  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getDoctorPatientsApi();
      setPatients(res.patients || []);
      if (res.patients && res.patients.length > 0 && !selectedPatient) {
        setSelectedPatient(res.patients[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch assigned patients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // 2. Fetch reports when selected patient or date changes
  useEffect(() => {
    if (!selectedPatient) return;

    const fetchReports = async () => {
      setReportsLoading(true);
      try {
        const res = await getPatientReportsApi(selectedPatient.id, anchorDate);
        setPatientReports(res);
      } catch (err) {
        console.error('Failed to load patient reports', err);
      } finally {
        setReportsLoading(false);
      }
    };

    fetchReports();
  }, [selectedPatient, anchorDate]);

  const handleAssignPatient = async (e) => {
    e.preventDefault();
    setAssignMsg('');
    setAssignError('');
    if (!assignEmail.trim()) return;

    try {
      const res = await assignPatientApi(assignEmail.trim());
      setAssignMsg(res.message);
      setAssignEmail('');
      fetchPatients();
    } catch (err) {
      setAssignError(err.message || 'Failed to assign patient.');
    }
  };

  return (
    <main className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        borderRadius: '16px',
        padding: '1.75rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '3.25rem',
            height: '3.25rem',
            borderRadius: '12px',
            backgroundColor: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <Stethoscope size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Physician Care Portal</h2>
              <span className="badge" style={{ backgroundColor: '#38bdf8', color: '#0f172a' }}>
                Doctor View
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
              Clinical surveillance and blood glucose management for your assigned diabetes patient panel
            </p>
          </div>
        </div>

        {/* Anchor date picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 0.85rem', borderRadius: '10px' }}>
          <Calendar size={15} color="#38bdf8" />
          <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Report Anchor:</span>
          <input
            type="date"
            max={getTodayString()}
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 320px) 1fr',
        gap: '1.75rem',
        alignItems: 'start'
      }}>
        {/* Left: Patient List Sidebar */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={18} color="var(--color-primary)" />
              Assigned Patients ({patients.length})
            </h3>
          </div>

          {/* Quick Add Patient */}
          <form onSubmit={handleAssignPatient} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <input
                type="email"
                placeholder="Assign patient email..."
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                className="input-field"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.45rem 0.75rem' }}>
                <Plus size={14} />
              </button>
            </div>
            {assignMsg && <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.35rem' }}>{assignMsg}</div>}
            {assignError && <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.35rem' }}>{assignError}</div>}
          </form>

          {/* Patients list */}
          {loading ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              No patients assigned yet. Use the input above to assign a patient.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {patients.map((p) => {
                const isSelected = selectedPatient && selectedPatient.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : '#ffffff',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {p.email}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', fontSize: '0.75rem' }}>
                      <span style={{ color: '#475569' }}>
                        {p.total_readings} records
                      </span>
                      {p.avg_glucose && (
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                          Avg: {p.avg_glucose} mg/dl
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Patient's Reports & Trends */}
        <div>
          {selectedPatient ? (
            <>
              {/* Selected Patient Banner */}
              <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    Active Patient Surveillance
                  </span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                    {selectedPatient.name}
                  </h3>
                  <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
                    Email: {selectedPatient.email}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Reporting Anchor Date</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {anchorDate}
                  </div>
                </div>
              </div>

              {/* Patient Reports Grid */}
              {reportsLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                  Loading patient analytics...
                </div>
              ) : patientReports ? (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1.25rem'
                  }}>
                    <ReportSummaryCard report={patientReports.daily} showDailyList={true} />
                    <ReportSummaryCard report={patientReports.monthToDate} showDailyList={false} />
                    <ReportSummaryCard report={patientReports.monthly} showDailyList={false} />
                  </div>

                  {patientReports.chartData && patientReports.chartData.length > 0 && (
                    <GlucoseTrendChart data={patientReports.chartData} />
                  )}
                </>
              ) : null}
            </>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              Select a patient on the left to inspect their clinical reports.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
