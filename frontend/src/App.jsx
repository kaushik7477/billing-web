import React, { useState, useEffect } from 'react';
import PortalScreen from './components/PortalScreen';
import PinModal from './components/PinModal';
import AdminLoginModal from './components/AdminLoginModal';
import BillingEngine from './components/BillingEngine';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import BillHistoryDrawer from './components/BillHistoryDrawer';

export default function App() {
  // Navigation View: 'portal' | 'billing' | 'admin'
  const [currentView, setCurrentView] = useState('portal');
  
  // Hotels List
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  
  // Auth state
  const [managerToken, setManagerToken] = useState(localStorage.getItem('hotel_manager_token') || '');
  const [adminToken, setAdminToken] = useState(localStorage.getItem('hotel_admin_token') || '');
  
  // Modals state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Fetch hotels for portal screen
  const fetchHotels = async () => {
    try {
      const res = await fetch('/api/hotels');
      const data = await res.json();
      if (data.success) {
        setHotels(data.hotels);
      }
    } catch (err) {
      console.error('Failed to fetch hotels:', err);
    }
  };

  useEffect(() => {
    fetchHotels();

    // Check if previous session was admin
    if (adminToken) {
      setCurrentView('admin');
    }
  }, []);

  // When user clicks a hotel box
  const handleSelectHotel = (hotel) => {
    setSelectedHotel(hotel);
    setIsPinModalOpen(true);
  };

  // On successful Manager PIN verification
  const handleManagerLoginSuccess = (hotel, token) => {
    setSelectedHotel(hotel);
    setManagerToken(token);
    localStorage.setItem('hotel_manager_token', token);
    setIsPinModalOpen(false);
    setCurrentView('billing');
  };

  // On successful Admin login
  const handleAdminLoginSuccess = (token) => {
    setAdminToken(token);
    localStorage.setItem('hotel_admin_token', token);
    setIsAdminModalOpen(false);
    setCurrentView('admin');
  };

  // Logout / Return to Portal
  const handleLogout = () => {
    localStorage.removeItem('hotel_manager_token');
    localStorage.removeItem('hotel_admin_token');
    setManagerToken('');
    setAdminToken('');
    setSelectedHotel(null);
    setCurrentView('portal');
    fetchHotels();
  };

  return (
    <div className="min-h-screen">
      
      {/* 1. PORTAL VIEW (3 Hotel Boxes + 1 Super Admin Box) */}
      {currentView === 'portal' && (
        <PortalScreen
          hotels={hotels}
          onSelectHotel={handleSelectHotel}
          onOpenAdminLogin={() => setIsAdminModalOpen(true)}
        />
      )}

      {/* 2. MANAGER BILLING VIEW */}
      {currentView === 'billing' && selectedHotel && (
        <BillingEngine
          hotel={selectedHotel}
          token={managerToken}
          onLogout={handleLogout}
          onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        />
      )}

      {/* 3. SUPER ADMIN DASHBOARD VIEW */}
      {currentView === 'admin' && (
        <SuperAdminDashboard
          token={adminToken}
          onLogout={handleLogout}
        />
      )}

      {/* PIN Verification Modal */}
      <PinModal
        hotel={selectedHotel}
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onLoginSuccess={handleManagerLoginSuccess}
      />

      {/* Super Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Bill Records Drawer */}
      <BillHistoryDrawer
        hotel={selectedHotel}
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        onSelectBill={(bill) => {
          setIsHistoryDrawerOpen(false);
        }}
      />

    </div>
  );
}
