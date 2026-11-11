import React, { useState, useEffect } from 'react';
import { getReportsApi } from '../api/reports';
import ReportSummaryCard from '../components/ReportSummaryCard';
import GlucoseTrendChart from '../components/GlucoseTrendChart';
import { Calendar, AlertCircle, RefreshCw, Printer, ArrowLeft } from 'lucide-react';

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ReportsPage({ onNavigateToDashboard }) {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async (date) => {
    setLoading(true);
    setError('');
    try {
      const data = await getReportsApi(date);
      setReportsData(data);
    } catch (err) {
      setError(err.message || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedDate);
  }, [selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <button
            onClick={onNavigateToDashboard}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginBottom: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} />
            Back to Readings Log
          </button>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Clinical Glucose Reports
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Daily, Month-to-date, and Monthly statistical summaries for clinical review
          </p>
        </div>

        {/* Date Selector & Print */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'white',
            padding: '0.45rem 0.85rem',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Calendar size={16} color="var(--color-primary)" />
            <label htmlFor="report-date" style={{ fontSize: '0.825rem', fontWeight: 600, color: '#475569' }}>
              Anchor Date:
            </label>
            <input
              id="report-date"
              type="date"
              max={getTodayString()}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer'
              }}
            />
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handlePrint}
            title="Print Reports"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Printer size={15} />
            Print Report
          </button>
        </div>
      </div>

      {/* Loading or Error State */}
      {loading ? (
        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <div>Generating clinical reports...</div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : reportsData ? (
        <>
          {/* 3 Report Cards Grid: Daily, Month-to-date, Monthly */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            alignItems: 'stretch'
          }}>
            {/* 1. Daily Report (also lists each reading with its slot) */}
            <ReportSummaryCard report={reportsData.daily} showDailyList={true} />

            {/* 2. Month-to-date Report */}
            <ReportSummaryCard report={reportsData.monthToDate} showDailyList={false} />

            {/* 3. Monthly Report (The whole previous month) */}
            <ReportSummaryCard report={reportsData.monthly} showDailyList={false} />
          </div>

          {/* Bonus: Trend Chart over the Month */}
          {reportsData.chartData && reportsData.chartData.length > 0 && (
            <GlucoseTrendChart data={reportsData.chartData} />
          )}
        </>
      ) : null}
    </main>
  );
}
