import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        color: 'white',
        padding: '0.65rem 0.85rem',
        borderRadius: '8px',
        fontSize: '0.8rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{data.date}</div>
        <div style={{ color: '#93c5fd' }}>{data.slot}</div>
        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
          {data.value} mg/dl
        </div>
      </div>
    );
  }
  return null;
}

export default function GlucoseTrendChart({ data = [] }) {
  if (!data || data.length === 0) {
    return null;
  }

  // Format data for chart
  const chartData = data.map((d) => ({
    date: d.reading_date.slice(5), // MM-DD
    fullDate: d.reading_date,
    slot: d.time_slot,
    value: Number(d.glucose_value)
  }));

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
            Month-to-Date Glucose Trend Line
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Chronological blood glucose readings with clinical reference bands
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'inline-block' }}></span>
            <span>Recorded Reading</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '12px', height: '2px', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            <span>Normal Fasting (100)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '12px', height: '2px', backgroundColor: '#f59e0b', display: 'inline-block' }}></span>
            <span>Post-Meal Max (140)</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              stroke="#94a3b8"
              fontSize={11}
            />
            <YAxis
              domain={[40, 'auto']}
              tickLine={false}
              stroke="#94a3b8"
              fontSize={11}
              unit=" mg"
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 4" />
            <ReferenceLine y={140} stroke="#f59e0b" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0284c7"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: '#0369a1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
