import React, { useState, useEffect } from 'react';
import { getReadingsApi, deleteReadingApi } from '../api/readings';
import {
  Plus,
  Calendar,
  Filter,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Coffee,
  Utensils,
  Moon,
  AlertCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';

const SLOTS_META = [
  { name: 'Morning (fasting)', icon: Sun, color: '#f59e0b', desc: 'Target: 70–99 mg/dl' },
  { name: 'After breakfast', icon: Coffee, color: '#0284c7', desc: 'Target: <140 mg/dl' },
  { name: 'After lunch', icon: Utensils, color: '#10b981', desc: 'Target: <140 mg/dl' },
  { name: 'After dinner', icon: Moon, color: '#8b5cf6', desc: 'Target: <140 mg/dl' }
];

function getReadingClassification(value, slot) {
  const isFasting = slot && slot.includes('fasting');
  if (value < 70) {
    return { label: 'Low', badgeClass: 'badge-low', note: 'Hypoglycemic range' };
  }
  if (isFasting) {
    if (value <= 99) return { label: 'In Target', badgeClass: 'badge-in-target', note: 'Normal fasting' };
    if (value <= 125) return { label: 'Elevated', badgeClass: 'badge-elevated', note: 'Pre-diabetic' };
    return { label: 'High', badgeClass: 'badge-high', note: 'Elevated fasting' };
  } else {
    if (value < 140) return { label: 'In Target', badgeClass: 'badge-in-target', note: 'Normal post-meal' };
    if (value < 200) return { label: 'Elevated', badgeClass: 'badge-elevated', note: 'Borderline' };
    return { label: 'High', badgeClass: 'badge-high', note: 'High post-meal' };
  }
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DashboardPage({ onOpenAddModal, onEditReading, refreshKey, onNavigateToReports }) {
  const [readings, setReadings] = useState([]);
  const [todayReadings, setTodayReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterDate, setFilterDate] = useState('');
  const [filterSlot, setFilterSlot] = useState('');

  // Delete modal state
  const [deletingId, setDeletingId] = useState(null);

  const fetchReadings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (filterDate) params.date = filterDate;
      if (filterSlot) params.slot = filterSlot;

      const data = await getReadingsApi(params);
      setReadings(data.readings || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.total || 0);

      // Also fetch today's readings for the 4-slot top bar
      const today = getTodayString();
      const todayData = await getReadingsApi({ date: today, limit: 10 });
      setTodayReadings(todayData.readings || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch readings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, [page, limit, filterDate, filterSlot, refreshKey]);

  const handleDelete = async (id) => {
    try {
      await deleteReadingApi(id);
      setDeletingId(null);
      fetchReadings();
    } catch (err) {
      alert(err.message || 'Failed to delete reading.');
    }
  };

  const handleQuickAddSlot = (slotName) => {
    onOpenAddModal({
      reading_date: getTodayString(),
      time_slot: slotName,
      glucose_value: ''
    });
  };

  return (
    <main className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Top Welcome / Daily Progress */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Today's Glucose Log
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Record up to 4 readings a day. Track fasting and post-meal glucose.
            </p>
          </div>

          <button
            className="btn btn-secondary"
            onClick={onNavigateToReports}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <FileText size={16} />
            View Reports
          </button>
        </div>

        {/* 4 Daily Slots Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}>
          {SLOTS_META.map((meta) => {
            const recorded = todayReadings.find((r) => r.time_slot === meta.name);
            const IconComponent = meta.icon;

            return (
              <div
                key={meta.name}
                className="card"
                style={{
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: recorded ? '1px solid #cbd5e1' : '1px dashed #cbd5e1',
                  background: recorded ? '#ffffff' : '#f8fafc'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '8px',
                        backgroundColor: `${meta.color}18`,
                        color: meta.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IconComponent size={16} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>
                        {meta.name}
                      </span>
                    </div>

                    {recorded && (
                      <CheckCircle2 size={17} color="var(--color-success)" />
                    )}
                  </div>

                  {recorded ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                          {recorded.glucose_value}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>mg/dl</span>
                      </div>
                      <div style={{ marginTop: '0.35rem' }}>
                        {(() => {
                          const cls = getReadingClassification(recorded.glucose_value, recorded.time_slot);
                          return <span className={`badge ${cls.badgeClass}`}>{cls.label}</span>;
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: '0.825rem', marginTop: '0.5rem' }}>
                      Not recorded yet today
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                  {recorded ? (
                    <button
                      onClick={() => onEditReading(recorded)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Edit2 size={13} />
                      Edit reading
                    </button>
                  ) : (
                    <button
                      onClick={() => handleQuickAddSlot(meta.name)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-primary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Plus size={13} />
                      Record now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Readings Log Section */}
      <section className="card" style={{ padding: '1.5rem' }}>
        {/* Table Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              All Readings History
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b' }}>
              {totalRecords} {totalRecords === 1 ? 'record' : 'records'} logged
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Filter by Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <input
                type="date"
                className="input-field"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setPage(1);
                }}
                style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
              />
              {filterDate && (
                <button
                  onClick={() => {
                    setFilterDate('');
                    setPage(1);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.45rem 0.65rem' }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter by Slot */}
            <select
              className="input-field"
              value={filterSlot}
              onChange={(e) => {
                setFilterSlot(e.target.value);
                setPage(1);
              }}
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem', width: 'auto' }}
            >
              <option value="">All Time Slots</option>
              {SLOTS_META.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table or Empty State */}
        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
            Loading readings...
          </div>
        ) : error ? (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : readings.length === 0 ? (
          <div style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed var(--color-border)'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              backgroundColor: '#e2e8f0',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              marginBottom: '0.75rem'
            }}>
              <Calendar size={24} />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155' }}>
              No glucose readings found
            </h4>
            <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.25rem', marginBottom: '1rem' }}>
              {filterDate || filterSlot
                ? 'No readings match your filter criteria. Try clearing filters.'
                : 'Start tracking your blood sugar by recording your first reading.'}
            </p>
            <button className="btn btn-primary btn-sm" onClick={onOpenAddModal}>
              <Plus size={15} />
              Record First Reading
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Time Slot</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Glucose Level</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => {
                  const classification = getReadingClassification(r.glucose_value, r.time_slot);
                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.1s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                        {r.reading_date}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: '#334155' }}>
                        {r.time_slot}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                          {r.glucose_value}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.25rem', fontWeight: 500 }}>
                          mg/dl
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge ${classification.badgeClass}`}>
                          {classification.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={() => onEditReading(r)}
                            title="Edit Reading"
                            style={{
                              background: '#f1f5f9',
                              border: 'none',
                              padding: '0.4rem',
                              borderRadius: '6px',
                              color: '#475569',
                              display: 'flex'
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingId(r.id)}
                            title="Delete Reading"
                            style={{
                              background: '#ffe4e6',
                              border: 'none',
                              padding: '0.4rem',
                              borderRadius: '6px',
                              color: '#e11d48',
                              display: 'flex'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--color-border)',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
              Showing Page {page} of {totalPages} ({totalRecords} total readings)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="modal-overlay" onClick={() => setDeletingId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Confirm Delete
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Are you sure you want to delete this blood glucose reading? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setDeletingId(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(deletingId)}
              >
                Delete Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
