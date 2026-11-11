import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ReadingFormModal from './components/ReadingFormModal';
import { HeartPulse } from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('readings'); // 'readings' | 'reports'

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        color: '#64748b'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
          color: 'white',
          borderRadius: '16px',
          width: '3.5rem',
          height: '3.5rem',
          marginBottom: '1rem',
          boxShadow: '0 8px 20px rgba(225, 29, 72, 0.25)'
        }}>
          <HeartPulse size={30} />
        </div>
        <div style={{ fontWeight: 600, fontSize: '1.05rem', color: '#1e293b' }}>Sweety</div>
        <div style={{ fontSize: '0.85rem' }}>Loading patient dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <LoginPage onNavigateToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onNavigateToLogin={() => setAuthView('login')} />
    );
  }

  const handleOpenAddModal = (initialSlotData = null) => {
    setEditingReading(initialSlotData);
    setModalOpen(true);
  };

  const handleOpenEditModal = (reading) => {
    setEditingReading(reading);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => handleOpenAddModal()}
      />

      <div style={{ flex: 1 }}>
        {activeTab === 'readings' ? (
          <DashboardPage
            onOpenAddModal={handleOpenAddModal}
            onEditReading={handleOpenEditModal}
            refreshKey={refreshKey}
            onNavigateToReports={() => setActiveTab('reports')}
          />
        ) : (
          <ReportsPage
            onNavigateToDashboard={() => setActiveTab('readings')}
          />
        )}
      </div>

      {/* Global Reading Modal */}
      <ReadingFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingReading}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
