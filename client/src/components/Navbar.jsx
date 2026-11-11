import React from 'react';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, PlusCircle, BarChart3, ListFilter, LogOut, User } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenAddModal }) {
  const { user, logout } = useAuth();

  return (
    <header style={{
      backgroundColor: 'white',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '4.25rem'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
             onClick={() => setActiveTab('readings')}>
          <div style={{
            background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
            color: 'white',
            borderRadius: '12px',
            width: '2.5rem',
            height: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(225, 29, 72, 0.3)'
          }}>
            <HeartPulse size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#0f172a', lineHeight: 1.1 }}>
              Sweety
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              Blood Glucose Tracker
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('readings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              backgroundColor: activeTab === 'readings' ? 'var(--color-primary-light)' : 'transparent',
              color: activeTab === 'readings' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              border: 'none'
            }}
          >
            <ListFilter size={18} />
            Readings
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              backgroundColor: activeTab === 'reports' ? 'var(--color-primary-light)' : 'transparent',
              color: activeTab === 'reports' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              border: 'none'
            }}
          >
            <BarChart3 size={18} />
            Reports
          </button>
        </nav>

        {/* Right CTA & User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={onOpenAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <PlusCircle size={16} />
            Add Reading
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            paddingLeft: '0.75rem',
            borderLeft: '1px solid var(--color-border)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#334155'
            }}>
              <div style={{
                width: '1.85rem',
                height: '1.85rem',
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b'
              }}>
                <User size={15} />
              </div>
              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Patient'}
              </span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                padding: '0.35rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
