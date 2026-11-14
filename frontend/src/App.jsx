import React, { useState, useEffect } from 'react';
import PortalScreen from './components/PortalScreen';
import ManagerWorkspace from './components/ManagerWorkspace';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import BillHistoryDrawer from './components/BillHistoryDrawer';

export default function App() {
  // Normalize pathname to: '/' | '/admin' | '/manager'
  const getNormalizedPath = () => {
    const p = (window.location.pathname || '/').toLowerCase().replace(/\/+$/, '');
    if (p.startsWith('/admin')) return '/admin';
    if (p.startsWith('/manager') || p.startsWith('/billing')) return '/manager';
    return '/';
  };

  const [currentPath, setCurrentPath] = useState(getNormalizedPath);

  // Navigate helper to change browser address bar without hard reload
  const navigate = (path) => {
    const target = path.startsWith('/') ? path : `/${path}`;
    if (window.location.pathname !== target) {
      window.history.pushState({}, '', target);
    }
    setCurrentPath(target);
  };

  // Sync with browser Back and Forward navigation buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getNormalizedPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Selected Hotel for Manager View
  const [selectedHotel, setSelectedHotel] = useState(() => {
    try {
      const saved = localStorage.getItem('hotel_manager_hotel');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Auth tokens (completely isolated per role)
  const [managerToken, setManagerToken] = useState(() => localStorage.getItem('hotel_manager_token') || '');
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('hotel_admin_token') || '');

  // Modals state
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // When user visits root '/', if they are on a direct link, stay or redirect cleanly
  useEffect(() => {
    const path = getNormalizedPath();
    if (path === '/') {
      // If user came to root '/', redirect to their active role if only one is logged in
      if (adminToken && !managerToken) {
        navigate('/admin');
      } else if (managerToken && selectedHotel && !adminToken) {
        navigate('/manager');
      }
    }
  }, []);

  // On successful Manager login
  const handleManagerLoginSuccess = (hotel, token) => {
    setSelectedHotel(hotel);
    setManagerToken(token);
    localStorage.setItem('hotel_manager_token', token);
    localStorage.setItem('hotel_manager_hotel', JSON.stringify(hotel));
    navigate('/manager');
  };

  // On successful Admin login
  const handleAdminLoginSuccess = (token) => {
    setAdminToken(token);
    localStorage.setItem('hotel_admin_token', token);
    navigate('/admin');
  };

  // Manager Logout: ONLY clears Manager session (Leaves Admin session untouched)
  const handleManagerLogout = () => {
    localStorage.removeItem('hotel_manager_token');
    localStorage.removeItem('hotel_manager_hotel');
    setManagerToken('');
    setSelectedHotel(null);
    navigate('/manager');
  };

  // Admin Logout: ONLY clears Admin session (Leaves Manager session untouched)
  const handleAdminLogout = () => {
    localStorage.removeItem('hotel_admin_token');
    setAdminToken('');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen">
      
      {/* 1. SUPER ADMIN ROUTE (/admin) */}
      {currentPath === '/admin' && (
        adminToken ? (
          <SuperAdminDashboard
            token={adminToken}
            onLogout={handleAdminLogout}
            onNavigateManager={() => navigate('/manager')}
          />
        ) : (
          <PortalScreen
            targetRole="admin"
            onManagerLoginSuccess={handleManagerLoginSuccess}
            onAdminLoginSuccess={handleAdminLoginSuccess}
            onNavigate={navigate}
          />
        )
      )}

      {/* 2. MANAGER WORKSPACE ROUTE (/manager) */}
      {currentPath === '/manager' && (
        (managerToken && selectedHotel) ? (
          <ManagerWorkspace
            hotel={selectedHotel}
            token={managerToken}
            onLogout={handleManagerLogout}
            onNavigateAdmin={() => navigate('/admin')}
          />
        ) : (
          <PortalScreen
            targetRole="manager"
            onManagerLoginSuccess={handleManagerLoginSuccess}
            onAdminLoginSuccess={handleAdminLoginSuccess}
            onNavigate={navigate}
          />
        )
      )}

      {/* 3. ROOT UNIFIED PORTAL (/) */}
      {currentPath === '/' && (
        <PortalScreen
          targetRole="all"
          adminLoggedIn={!!adminToken}
          managerLoggedIn={!!(managerToken && selectedHotel)}
          activeHotelName={selectedHotel?.name}
          onManagerLoginSuccess={handleManagerLoginSuccess}
          onAdminLoginSuccess={handleAdminLoginSuccess}
          onNavigate={navigate}
        />
      )}

      {/* Bill Records Drawer */}
      <BillHistoryDrawer
        hotel={selectedHotel}
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        onSelectBill={() => setIsHistoryDrawerOpen(false)}
      />

    </div>
  );
}
