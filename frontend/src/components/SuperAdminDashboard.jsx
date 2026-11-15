import React, { useState, useEffect, useCallback } from 'react';
import { formatINR } from '../utils/numberToWords';
import { 
  Menu, X, Download, RefreshCw, LogOut, ShieldCheck, 
  Printer, ArrowLeft, Sparkles, Building2
} from 'lucide-react';

import InvoicePreview from './InvoicePreview';
import { downloadInvoicePdf, printInvoicePdf } from '../utils/pdfExport';

// Modular Super Admin Subcomponents
import SuperAdminSidebar from './superadmin/SuperAdminSidebar';
import DashboardLauncher from './superadmin/DashboardLauncher';
import RoomMatrixView from './superadmin/RoomMatrixView';
import InHouseGuestsView from './superadmin/InHouseGuestsView';
import CashAuditView from './superadmin/CashAuditView';
import RevenueAnalyticsView from './superadmin/RevenueAnalyticsView';
import AdvanceBookingsView from './superadmin/AdvanceBookingsView';
import MaintenanceAlertsView from './superadmin/MaintenanceAlertsView';
import ManagerAccessView from './superadmin/ManagerAccessView';
import RoomsTariffConfigView from './superadmin/RoomsTariffConfigView';
import InvoicesArchiveView from './superadmin/InvoicesArchiveView';

export default function SuperAdminDashboard({ token, onLogout, onNavigateManager }) {
  // Navigation State
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Data States
  const [hotels, setHotels] = useState([]);
  const [activityOverview, setActivityOverview] = useState({});
  const [rooms, setRooms] = useState([]);
  const [advanceBookings, setAdvanceBookings] = useState([]);
  const [maintenanceIssues, setMaintenanceIssues] = useState([]);
  const [summary, setSummary] = useState(null);
  const [dayByDayData, setDayByDayData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [allBills, setAllBills] = useState([]);

  // Filter States
  const [hotelFilter, setHotelFilter] = useState('all');
  const [datePreset, setDatePreset] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [selectedBillForPreview, setSelectedBillForPreview] = useState(null);

  // 1. Fetch Hotels List
  const fetchAdminHotels = useCallback(async () => {
    try {
      const res = await fetch('/api/hotels/admin-list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHotels(data.hotels);
      }
    } catch (err) {
      console.error('Failed to fetch admin hotels:', err);
    }
  }, [token]);

  // 2. Fetch Live Activity Overview across 3 Hotels
  const fetchActivityOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/activity/overview');
      const data = await res.json();
      if (data.success && data.overview) {
        setActivityOverview(data.overview);
      }
    } catch (err) {
      console.error('Failed to fetch activity overview:', err);
    }
  }, []);

  // 3. Fetch Rooms Inventory (all hotels)
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms?hotelId=all');
      const data = await res.json();
      if (data.success && data.rooms) {
        setRooms(data.rooms);
      }
    } catch (err) {
      console.error('Failed to fetch rooms inventory:', err);
    }
  }, []);

  // 4. Fetch Advance Bookings (all hotels)
  const fetchAdvanceBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/advance-bookings?hotelId=all');
      const data = await res.json();
      if (data.success && data.bookings) {
        setAdvanceBookings(data.bookings);
      }
    } catch (err) {
      console.error('Failed to fetch advance bookings:', err);
    }
  }, []);

  // 5. Fetch Active Maintenance Issues
  const fetchMaintenanceIssues = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms/all-issues');
      const data = await res.json();
      if (data.success && data.issues) {
        setMaintenanceIssues(data.issues);
      }
    } catch (err) {
      console.error('Failed to fetch maintenance issues:', err);
    }
  }, []);

  // 6. Fetch Financial Analytics & Bills
  const fetchAnalytics = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (hotelFilter !== 'all') queryParams.append('hotelId', hotelFilter);
      if (paymentModeFilter !== 'all') queryParams.append('paymentMode', paymentModeFilter);
      if (statusFilter !== 'all') queryParams.append('paymentStatus', statusFilter);

      const now = new Date();
      if (datePreset === 'today') {
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        queryParams.append('startDate', todayStr);
        queryParams.append('endDate', todayStr);
      } else if (datePreset === 'week') {
        const last7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
        queryParams.append('startDate', last7.toISOString().split('T')[0]);
      } else if (datePreset === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        queryParams.append('startDate', startOfMonth.toISOString().split('T')[0]);
      } else if (datePreset === 'custom') {
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
      }

      const queryString = queryParams.toString();

      const [sumRes, dayRes, weekRes, monthRes, billsRes] = await Promise.all([
        fetch(`/api/analytics/summary?${queryString}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/analytics/day-by-day?${queryString}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/analytics/weekly?${queryString}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/analytics/monthly?${queryString}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/bills?${queryString}`)
      ]);

      const [sumData, dayData, weekData, monthData, billsData] = await Promise.all([
        sumRes.json(),
        dayRes.json(),
        weekRes.json(),
        monthRes.json(),
        billsRes.json()
      ]);

      if (sumData.success) setSummary(sumData.summary);
      if (dayData.success) setDayByDayData(dayData.data);
      if (weekData.success) setWeeklyData(weekData.data);
      if (monthData.success) setMonthlyData(monthData.data);
      if (billsData.success) setAllBills(billsData.bills);

    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [token, hotelFilter, paymentModeFilter, statusFilter, datePreset, startDate, endDate]);

  // Combined Refresh (silent = true prevents flickering on background sync)
  const handleRefreshAll = useCallback((silent = false) => {
    fetchAdminHotels();
    fetchActivityOverview();
    fetchRooms();
    fetchAdvanceBookings();
    fetchMaintenanceIssues();
    fetchAnalytics(silent);
  }, [fetchAdminHotels, fetchActivityOverview, fetchRooms, fetchAdvanceBookings, fetchMaintenanceIssues, fetchAnalytics]);

  // Real-time Live Event Sync via Server-Sent Events (SSE) + Auto-Refresh
  useEffect(() => {
    let eventSource = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'PING') return;
          // Instantly refresh all views without reload
          handleRefreshAll(true);
        } catch (err) {
          console.warn('SSE parse error:', err);
        }
      };
    } catch (e) {
      console.warn('SSE connection error:', e);
    }

    // Auto-refresh interval (every 8 seconds as fail-safe guarantee)
    const interval = setInterval(() => {
      handleRefreshAll(true);
    }, 8000);

    // Refresh instantly when user switches back to this browser tab
    const handleFocus = () => {
      handleRefreshAll(true);
    };
    window.addEventListener('focus', handleFocus);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleFocus();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [handleRefreshAll]);

  // Initial Data Load
  useEffect(() => {
    fetchAdminHotels();
    fetchActivityOverview();
    fetchRooms();
    fetchAdvanceBookings();
    fetchMaintenanceIssues();
  }, [fetchAdminHotels, fetchActivityOverview, fetchRooms, fetchAdvanceBookings, fetchMaintenanceIssues]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Toggle Password Display for specific hotel
  const togglePasswordVisibility = (hotelId) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [hotelId]: !prev[hotelId]
    }));
  };

  // CSV Export
  const handleExportCSV = () => {
    const queryParams = new URLSearchParams();
    if (hotelFilter !== 'all') queryParams.append('hotelId', hotelFilter);
    if (paymentModeFilter !== 'all') queryParams.append('paymentMode', paymentModeFilter);
    if (statusFilter !== 'all') queryParams.append('paymentStatus', statusFilter);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    window.open(`/api/analytics/export-csv?${queryParams.toString()}`, '_blank');
  };

  // Delete Invoice
  const handleDeleteBill = async (billId) => {
    if (!window.confirm('Are you sure you want to delete this invoice record permanently?')) return;
    try {
      const res = await fetch(`/api/bills/${billId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchAnalytics();
      } else {
        alert(data.message || 'Failed to delete bill.');
      }
    } catch (err) {
      alert('Error deleting bill.');
    }
  };

  // Mark Maintenance Issue Fixed
  const handleResolveIssue = async (issue) => {
    try {
      const res = await fetch(`/api/rooms/${issue.roomNumber}/issues/fix`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: issue.hotelId,
          issueId: issue.id || issue._id
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchMaintenanceIssues();
        fetchRooms();
        return true;
      } else {
        alert(data.message || 'Failed to resolve issue.');
        return false;
      }
    } catch (err) {
      alert('Network error resolving issue.');
      return false;
    }
  };

  // Active in-house guests count
  const inHouseCount = allBills.filter(b => b.billStatus === 'SAVED').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col lg:flex-row font-sans">
      
      {/* 1. LEFT SIDEBAR NAVIGATION (DESKTOP & MOBILE DRAWER) */}
      <SuperAdminSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onLogout={onLogout}
        onNavigateManager={onNavigateManager}
        onExportCSV={handleExportCSV}
        onRefresh={handleRefreshAll}
        isLoading={isLoading}
        issuesCount={maintenanceIssues.length}
        inHouseCount={inHouseCount}
      />

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className={`flex-1 flex flex-col lg:pl-64 min-w-0 ${selectedBillForPreview ? 'no-print print:hidden' : ''}`}>
        
        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 text-slate-700 hover:text-slate-900 bg-slate-100 border border-slate-200 rounded-xl cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span className="font-mono font-black text-sm tracking-wider text-slate-900">
                Admin PANEL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshAll}
              className="p-2 text-slate-700 hover:text-slate-900 bg-slate-100 border border-slate-200 rounded-xl cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 rounded-xl cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          
          {/* WINDOW 1: DASHBOARD APP LAUNCHER */}
          {activeNav === 'dashboard' && (
            <DashboardLauncher
              hotels={hotels}
              activityOverview={activityOverview}
              summary={summary}
              showPasswordMap={showPasswordMap}
              togglePasswordVisibility={togglePasswordVisibility}
              onOpenNav={setActiveNav}
              issuesCount={maintenanceIssues.length}
              inHouseCount={inHouseCount}
            />
          )}

          {/* WINDOW 2: LIVE ROOM MATRIX */}
          {activeNav === 'rooms' && (
            <RoomMatrixView
              rooms={rooms}
              hotels={hotels}
              allBills={allBills}
              token={token}
              onHotelsUpdated={fetchAdminHotels}
              onSelectBill={setSelectedBillForPreview}
              isLoading={isLoading}
              onRefresh={fetchRooms}
              onBackToDashboard={() => setActiveNav('dashboard')}
            />
          )}

          {/* WINDOW 3: IN-HOUSE GUESTS & PENDING DUES */}
          {activeNav === 'guests' && (
            <InHouseGuestsView
              allBills={allBills}
              onSelectBill={setSelectedBillForPreview}
              onBackToDashboard={() => setActiveNav('dashboard')}
            />
          )}

          {/* WINDOW 4: PAYMENT MODE & CASH AUDIT */}
          {activeNav === 'cashAudit' && (
            <CashAuditView
              allBills={allBills}
              summary={summary}
              hotelFilter={hotelFilter}
              setHotelFilter={setHotelFilter}
              datePreset={datePreset}
              setDatePreset={setDatePreset}
              onBackToDashboard={() => setActiveNav('dashboard')}
            />
          )}

          {/* WINDOW 5: VISUAL REVENUE ANALYTICS */}
          {activeNav === 'analytics' && (
            <RevenueAnalyticsView
              hotels={hotels}
              activityOverview={activityOverview}
              summary={summary}
              dayByDayData={dayByDayData}
              weeklyData={weeklyData}
              monthlyData={monthlyData}
              hotelFilter={hotelFilter}
              setHotelFilter={setHotelFilter}
              datePreset={datePreset}
              setDatePreset={setDatePreset}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onExportCSV={handleExportCSV}
              onBackToDashboard={() => setActiveNav('dashboard')}
            />
          )}

          {/* WINDOW 6: ADVANCE BOOKINGS */}
          {activeNav === 'advance' && (
            <AdvanceBookingsView
              bookings={advanceBookings}
              hotels={hotels}
              isLoading={isLoading}
              onRefresh={fetchAdvanceBookings}
              onBackToDashboard={() => setActiveNav('dashboard')}
            />
          )}

          {/* WINDOW 7: ROOM ISSUES & MAINTENANCE ALERTS */}
          {activeNav === 'maintenance' && (
            <MaintenanceAlertsView
              issues={maintenanceIssues}
              isLoading={isLoading}
              onRefresh={fetchMaintenanceIssues}
              onResolveIssue={handleResolveIssue}
              onBackToDashboard={() => setActiveNav('dashboard')}
            />
          )}

          {/* WINDOW 8: MANAGER ACCESS CONTROL */}
          {activeNav === 'managers' && (
            <ManagerAccessView
              hotels={hotels}
              token={token}
              onHotelsUpdated={fetchAdminHotels}
              onBackToDashboard={() => setActiveNav('dashboard')}
            />
          )}

          {/* WINDOW 9: ROOM & TARIFF CONFIGURATION */}
          {activeNav === 'tariffs' && (
            <RoomsTariffConfigView
              hotels={hotels}
              rooms={rooms}
              token={token}
              onRefresh={fetchRooms}
              onHotelsUpdated={fetchAdminHotels}
              onBackToDashboard={() => setActiveNav('dashboard')}
            />
          )}

          {/* WINDOW 10: INVOICES & MASTER BILLS ARCHIVE */}
          {activeNav === 'invoices' && (
            <InvoicesArchiveView
              allBills={allBills}
              hotelFilter={hotelFilter}
              setHotelFilter={setHotelFilter}
              datePreset={datePreset}
              setDatePreset={setDatePreset}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              paymentModeFilter={paymentModeFilter}
              setPaymentModeFilter={setPaymentModeFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onExportCSV={handleExportCSV}
              onSelectBill={setSelectedBillForPreview}
              onDeleteBill={handleDeleteBill}
              onBackToDashboard={() => setActiveNav('dashboard')}
            />
          )}

        </main>
      </div>

      {/* 3. BILL PREVIEW MODAL */}
      {selectedBillForPreview && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedBillForPreview(null);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex justify-center items-start print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:block"
        >
          <div className="relative max-w-3xl w-full my-4 sm:my-8 bg-white text-slate-900 rounded-2xl p-4 sm:p-6 shadow-2xl print:max-w-none print:w-full print:p-0 print:m-0 print:shadow-none print:border-none print:block">
            {/* Modal Header Bar with Title and Close button */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 no-print">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="font-bold text-sm text-slate-800 font-mono">
                  {selectedBillForPreview.isNonGST ? 'Bill Preview • ' : 'Tax Invoice & Guest Bill Preview • '}
                  {selectedBillForPreview.invoiceNo}
                </span>
              </div>
              <button
                onClick={() => setSelectedBillForPreview(null)}
                className="text-slate-400 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const matchedHotel = hotels.find(h => h.hotelId === selectedBillForPreview.hotelId) || {
                name: selectedBillForPreview.hotelName || (selectedBillForPreview.hotelId === 'hotel-2' ? 'HOTEL SERENA' : 'Hotel Rojana'),
                subText: selectedBillForPreview.hotelId === 'hotel-2' ? 'Organised By - Maa Tara Enterprise' : 'Organised by Maa Tara Enterprise',
                address: selectedBillForPreview.hotelId === 'hotel-2' ? 'Economy Hotel Sector, New Digha, Purba Medinipur, W.B.' : 'Old Digha, Purba Medinipur, W.B.',
                phone: '9046926801',
                gstin: '19ABYFM7409E1Z0',
                themeColor: '#1a365d'
              };

              return (
                <InvoicePreview
                  hotel={matchedHotel}
                  billData={selectedBillForPreview}
                  calculations={{
                    roomRentPerDay: selectedBillForPreview.roomRentPerDay,
                    baseAccommodation: selectedBillForPreview.baseAccommodation,
                    extraCharges: selectedBillForPreview.extraCharges,
                    subtotal: selectedBillForPreview.subtotal,
                    cgst: selectedBillForPreview.cgst,
                    sgst: selectedBillForPreview.sgst,
                    totalGst: selectedBillForPreview.totalGst,
                    netTotal: selectedBillForPreview.netTotal,
                    advancePaid: selectedBillForPreview.advancePaid,
                    balanceDue: selectedBillForPreview.balanceDue,
                    amountInWords: selectedBillForPreview.amountInWords,
                    roomsList: selectedBillForPreview.roomsList || []
                  }}
                  billSettings={{
                    isNonGST: Boolean(selectedBillForPreview.isNonGST),
                    showGST: !selectedBillForPreview.isNonGST,
                    showManagerSign: selectedBillForPreview.showManagerSign !== false,
                    showTerms: true,
                    showRemarks: true
                  }}
                />
              );
            })()}

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100 no-print">
              <button
                onClick={() => setSelectedBillForPreview(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('invoice-card');
                  const safeInv = String(selectedBillForPreview.invoiceNo || 'INV').replace(/[\/\\?%*:|"<>]/g, '-');
                  const hotelName = (selectedBillForPreview.hotelName || (selectedBillForPreview.hotelId === 'hotel-1' ? 'Hotel Rojana' : selectedBillForPreview.hotelId === 'hotel-2' ? 'HOTEL SERENA' : 'Hotel Sea Pearl')).replace(/\s+/g, '-');
                  const filename = `${hotelName}-Invoice-${safeInv}.pdf`;
                  downloadInvoicePdf(el, filename);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('invoice-card');
                  const safeInv = String(selectedBillForPreview.invoiceNo || 'INV').replace(/[\/\\?%*:|"<>]/g, '-');
                  const hotelName = (selectedBillForPreview.hotelName || (selectedBillForPreview.hotelId === 'hotel-1' ? 'Hotel Rojana' : selectedBillForPreview.hotelId === 'hotel-2' ? 'HOTEL SERENA' : 'Hotel Sea Pearl')).replace(/\s+/g, '-');
                  const filename = `${hotelName}-Invoice-${safeInv}.pdf`;
                  printInvoicePdf(el, filename);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
