import React from 'react';
import { ArrowUp, ArrowDown, Activity, Layers, Calendar, AlertCircle } from 'lucide-react';

function getReadingClassification(value, slot) {
  const isFasting = slot && slot.includes('fasting');
  if (value < 70) {
    return { label: 'Low', badgeClass: 'badge-low' };
  }
  if (isFasting) {
    if (value <= 99) return { label: 'Normal', badgeClass: 'badge-in-target' };
    if (value <= 125) return { label: 'Elevated', badgeClass: 'badge-elevated' };
    return { label: 'High', badgeClass: 'badge-high' };
  } else {
    // Postprandial
    if (value < 140) return { label: 'Normal', badgeClass: 'badge-in-target' };
    if (value < 200) return { label: 'Elevated', badgeClass: 'badge-elevated' };
    return { label: 'High', badgeClass: 'badge-high' };
  }
}

export default function ReportSummaryCard({ report, showDailyList = false }) {
  if (!report) return null;

  const { title, dateRange, count, highest, lowest, average, hasData, readings } = report;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
            {title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem' }}>
            <Calendar size={13} />
            <span>{dateRange}</span>
          </div>
        </div>

        <span className="badge" style={{
          backgroundColor: count > 0 ? 'var(--color-primary-light)' : '#f1f5f9',
          color: count > 0 ? 'var(--color-primary)' : '#94a3b8'
        }}>
          {count} {count === 1 ? 'Reading' : 'Readings'}
        </span>
      </div>

      {/* Main Content: Stats or Empty State */}
      {!hasData || count === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1rem',
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            marginBottom: '0.75rem'
          }}>
            <AlertCircle size={24} />
          </div>
          <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>
            No readings recorded
          </div>
          <p style={{ fontSize: '0.825rem', color: '#64748b', maxWidth: '280px', marginTop: '0.25rem' }}>
            There are no blood glucose records logged for this reporting period.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
          {/* Key Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem'
          }}>
            {/* Highest */}
            <div style={{
              background: '#fff1f2',
              borderRadius: '12px',
              padding: '0.85rem',
              border: '1px solid #ffe4e6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#e11d48', fontSize: '0.75rem', fontWeight: 600 }}>
                <ArrowUp size={14} />
                <span>Highest</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#9f1239', marginTop: '0.25rem' }}>
                {highest}
                <span style={{ fontSize: '0.75rem', fontWeight: 500, marginLeft: '0.25rem', color: '#be123c' }}>mg/dl</span>
              </div>
            </div>

            {/* Lowest */}
            <div style={{
              background: '#f0fdf4',
              borderRadius: '12px',
              padding: '0.85rem',
              border: '1px solid #dcfce7'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>
                <ArrowDown size={14} />
                <span>Lowest</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
                {lowest}
                <span style={{ fontSize: '0.75rem', fontWeight: 500, marginLeft: '0.25rem', color: '#166534' }}>mg/dl</span>
              </div>
            </div>

            {/* Average */}
            <div style={{
              background: '#f0f9ff',
              borderRadius: '12px',
              padding: '0.85rem',
              border: '1px solid #e0f2fe'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#0284c7', fontSize: '0.75rem', fontWeight: 600 }}>
                <Activity size={14} />
                <span>Average</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0369a1', marginTop: '0.25rem' }}>
                {average}
                <span style={{ fontSize: '0.75rem', fontWeight: 500, marginLeft: '0.25rem', color: '#0284c7' }}>mg/dl</span>
              </div>
            </div>
          </div>

          {/* If Daily report: list each reading with its slot */}
          {showDailyList && readings && readings.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Daily Readings by Slot
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {readings.map((r) => {
                  const classification = getReadingClassification(r.glucose_value, r.time_slot);
                  return (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                          {r.time_slot}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                          {r.glucose_value} <span style={{ fontSize: '0.725rem', fontWeight: 500, color: '#64748b' }}>mg/dl</span>
                        </span>
                        <span className={`badge ${classification.badgeClass}`}>
                          {classification.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
