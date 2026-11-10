import React, { useState, useEffect } from 'react';
import { formatINR } from '../utils/numberToWords';
import { 
  ShieldCheck, Building2, KeyRound, Download, Calendar, 
  Filter, Search, LogOut, CheckCircle2, TrendingUp, DollarSign, 
  CreditCard, Eye, Trash2, ArrowUpDown, RefreshCw, X, Edit3
} from 'lucide-react';
import InvoicePreview from './InvoicePreview';

export default function SuperAdminDashboard({ token, onLogout }) {
  // State
  const [hotels, setHotels] = useState([]);
  const [summary, setSummary] = useState(null);
  const [dayByDayData, setDayByDayData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [allBills, setAllBills] = useState([]);
  
  // Filters
  const [hotelFilter, setHotelFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('dayByDay'); // 'dayByDay', 'weekly', 'monthly', 'invoices'
  const [datePreset, setDatePreset] = useState('all'); // 'today', 'week', 'month', 'custom', 'all'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // PIN Editing State
  const [editingPinHotel, setEditingPinHotel] = useState(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  // Bill Inspection Modal
  const [selectedBillForPreview, setSelectedBillForPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Admin Hotels List (includes current PINs)
  const fetchAdminHotels = async () => {
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
  };

  // Fetch Financial Analytics & Bills
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (hotelFilter !== 'all') queryParams.append('hotelId', hotelFilter);
      if (paymentModeFilter !== 'all') queryParams.append('paymentMode', paymentModeFilter);
      if (statusFilter !== 'all') queryParams.append('paymentStatus', statusFilter);

      // Handle Date Presets
      const now = new Date();
      if (datePreset === 'today') {
        const todayStr = now.toISOString().split('T')[0];
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

      // Parallel Fetch
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminHotels();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [hotelFilter, datePreset, startDate, endDate, paymentModeFilter, statusFilter]);

  // Handle PIN Change
  const handleSavePin = async (hotelId) => {
    if (!newPinValue || newPinValue.length < 4) {
      alert('PIN must be at least 4 digits.');
      return;
    }

    setIsUpdatingPin(true);
    try {
      const res = await fetch(`/api/hotels/${hotelId}/pin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPin: newPinValue })
      });

      const data = await res.json();
      if (data.success) {
        setPinChangeMsg(data.message);
        setEditingPinHotel(null);
        setNewPinValue('');
        fetchAdminHotels();
        setTimeout(() => setPinChangeMsg(''), 4000);
      } else {
        alert(data.message || 'Failed to update PIN.');
      }
    } catch (err) {
      alert('Network error updating PIN.');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const queryParams = new URLSearchParams();
    if (hotelFilter !== 'all') queryParams.append('hotelId', hotelFilter);
    if (paymentModeFilter !== 'all') queryParams.append('paymentMode', paymentModeFilter);
    if (statusFilter !== 'all') queryParams.append('paymentStatus', statusFilter);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    window.open(`/api/analytics/export-csv?${queryParams.toString()}`, '_blank');
  };

  // Delete Bill
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
        alert(data.message);
      }
    } catch (err) {
      alert('Error deleting bill.');
    }
  };

  // Filtered bills by search term
  const filteredBills = allBills.filter(b => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.customerName?.toLowerCase().includes(term) ||
      b.invoiceNo?.toLowerCase().includes(term) ||
      b.customerPhone?.includes(term) ||
      b.roomNumber?.toLowerCase().includes(term) ||
      b.hotelName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      
      {/* Top Admin Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold text-xl shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white font-serif tracking-wide">
                  Super Admin HQ Portal
                </h1>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  Central Financial Analytics
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-Hotel Revenue Audit & Security Control
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel / CSV</span>
            </button>

            <button
              onClick={fetchAnalytics}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/40 border border-rose-500/30 rounded-lg transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Success Notification Bar */}
      {pinChangeMsg && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{pinChangeMsg}</span>
        </div>
      )}

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">

        {/* ======================================================== */}
        {/* SECTION 1: HOTEL MANAGER LOGIN PIN MANAGEMENT             */}
        {/* (Directly fulfilling user requirement)                   */}
        {/* ======================================================== */}
        <section className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-700/80 mb-4 gap-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Hotel Manager Login PIN Configuration</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every hotel has a distinct PIN. Managers use these to log into their billing dashboards.
              </p>
            </div>
            <span className="text-xs text-amber-400/90 font-mono bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 self-start sm:self-auto">
              3 Hotel Properties Configured
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hotels.map((hotel, index) => {
              const isEditing = editingPinHotel === hotel.hotelId;
              const isBlue = index === 0;
              const isGreen = index === 1;
              const borderCol = isBlue ? 'border-blue-500/40' : isGreen ? 'border-emerald-500/40' : 'border-indigo-500/40';

              return (
                <div
                  key={hotel.hotelId}
                  className={`bg-slate-900/90 rounded-xl p-4 border ${borderCol} flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Box {index + 1}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Operational
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white font-serif">{hotel.name}</h3>
                    <p className="text-xs text-amber-300 italic">{hotel.subText}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{hotel.address}</p>

                    {/* Current PIN Display */}
                    <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Manager PIN:</span>
                      <span className="font-mono text-base font-extrabold text-amber-400 tracking-widest">
                        {hotel.managerPin}
                      </span>
                    </div>
                  </div>

                  {/* PIN Edit Controls */}
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    {isEditing ? (
                      <div className="space-y-2 animate-fade-in">
                        <label className="text-[11px] font-semibold text-slate-300">Set New 4-Digit PIN:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={newPinValue}
                            onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                            placeholder="e.g. 5555"
                            className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-slate-800 border border-amber-500/60 rounded-lg text-amber-300 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePin(hotel.hotelId)}
                            disabled={isUpdatingPin || newPinValue.length < 4}
                            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingPinHotel(null); setNewPinValue(''); }}
                            className="px-2 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPinHotel(hotel.hotelId);
                          setNewPinValue(hotel.managerPin || '');
                        }}
                        className="w-full py-2 px-3 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Change Manager PIN</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SECTION 2: TOP KPI METRICS ROW                           */}
        {/* ======================================================== */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Gross Revenue</span>
              <span className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono">
                ₹ {formatINR(summary.totalRevenue)}
              </span>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Advance Received</span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
                ₹ {formatINR(summary.totalAdvance)}
              </span>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Balance Due</span>
              <span className="text-xl sm:text-2xl font-extrabold text-rose-400 font-mono">
                ₹ {formatINR(summary.totalBalanceDue)}
              </span>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total GST (5%)</span>
              <span className="text-xl sm:text-2xl font-extrabold text-blue-400 font-mono">
                ₹ {formatINR(summary.totalGst)}
              </span>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Invoices</span>
              <span className="text-xl sm:text-2xl font-extrabold text-purple-400 font-mono">
                {summary.totalBills}
              </span>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Guests Hosted</span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-200 font-mono">
                {summary.totalGuests}
              </span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 3: FILTER CONTROLS & TIME PRESETS                */}
        {/* ======================================================== */}
        <section className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 shadow-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Property Selector */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <select
                value={hotelFilter}
                onChange={(e) => setHotelFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">🏢 All 3 Hotels (Consolidated)</option>
                <option value="hotel-1">Hotel Rojana (Box 1)</option>
                <option value="hotel-2">Hotel Sagar Priya (Box 2)</option>
                <option value="hotel-3">Hotel Sea Pearl (Box 3)</option>
              </select>
            </div>

            {/* Date Range Presets */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setDatePreset('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${datePreset === 'all' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                All Time
              </button>
              <button
                onClick={() => setDatePreset('today')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${datePreset === 'today' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Today
              </button>
              <button
                onClick={() => setDatePreset('week')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${datePreset === 'week' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDatePreset('month')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${datePreset === 'month' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                This Month
              </button>
              <button
                onClick={() => setDatePreset('custom')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${datePreset === 'custom' ? 'bg-amber-500 text-slate-900 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Custom Range
              </button>
            </div>

            {/* Payment & Status Filters */}
            <div className="flex items-center gap-2">
              <select
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-300"
              >
                <option value="all">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR</option>
                <option value="Card">Card</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-300"
              >
                <option value="all">All Status</option>
                <option value="PAID">Paid in Full</option>
                <option value="DUE">Balance Due</option>
              </select>
            </div>

          </div>

          {/* Custom Date Pickers (if selected) */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-700 text-xs">
              <span className="text-slate-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
              />
              <span className="text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
              />
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* SECTION 4: FINANCIAL REPORTS (DAY BY DAY, WEEKLY, MONTHLY)*/}
        {/* ======================================================== */}
        <section className="bg-slate-800/90 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          
          {/* View Switcher Tabs */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-950/50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('dayByDay')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'dayByDay' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Day-by-Day Financials</span>
              </button>

              <button
                onClick={() => setActiveTab('weekly')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'weekly' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Weekly Summary</span>
              </button>

              <button
                onClick={() => setActiveTab('monthly')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'monthly' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Monthly Summary</span>
              </button>

              <button
                onClick={() => setActiveTab('invoices')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'invoices' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Individual Invoices ({filteredBills.length})</span>
              </button>
            </div>

            {/* Search within table */}
            {activeTab === 'invoices' && (
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search guest, invoice no..."
                  className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            )}
          </div>

          {/* TABLE DISPLAY */}
          <div className="overflow-x-auto">
            
            {/* 1. DAY-BY-DAY TABLE */}
            {activeTab === 'dayByDay' && (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-700">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3 text-center">Bills Count</th>
                    <th className="py-3 px-3 text-right">Gross Revenue (₹)</th>
                    <th className="py-3 px-3 text-right">Advance Received (₹)</th>
                    <th className="py-3 px-3 text-right">Balance Due (₹)</th>
                    <th className="py-3 px-3 text-right">GST (5%) (₹)</th>
                    <th className="py-3 px-3 text-center">Guests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-mono">
                  {dayByDayData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                        No financial records found for this filter criteria.
                      </td>
                    </tr>
                  ) : (
                    dayByDayData.map((row) => (
                      <tr key={row.dateKey} className="hover:bg-slate-700/30 transition">
                        <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>{row.dateLabel}</span>
                        </td>
                        <td className="py-3 px-3 text-center text-purple-300 font-bold">{row.billsCount}</td>
                        <td className="py-3 px-3 text-right text-amber-400 font-bold">{formatINR(row.revenue)}</td>
                        <td className="py-3 px-3 text-right text-emerald-400">{formatINR(row.advance)}</td>
                        <td className="py-3 px-3 text-right text-rose-400">{formatINR(row.balanceDue)}</td>
                        <td className="py-3 px-3 text-right text-blue-300">{formatINR(row.gst)}</td>
                        <td className="py-3 px-3 text-center font-sans text-slate-300">{row.guests}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* 2. WEEKLY TABLE */}
            {activeTab === 'weekly' && (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-700">
                    <th className="py-3 px-4">Week Period</th>
                    <th className="py-3 px-3 text-center">Bills</th>
                    <th className="py-3 px-3 text-right">Gross Revenue (₹)</th>
                    <th className="py-3 px-3 text-right">Advance Received (₹)</th>
                    <th className="py-3 px-3 text-right">Balance Due (₹)</th>
                    <th className="py-3 px-3 text-right">GST (5%) (₹)</th>
                    <th className="py-3 px-3 text-center">Guests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-mono">
                  {weeklyData.map((row) => (
                    <tr key={row.weekKey} className="hover:bg-slate-700/30 transition">
                      <td className="py-3 px-4 font-sans font-bold text-white">{row.weekLabel}</td>
                      <td className="py-3 px-3 text-center text-purple-300 font-bold">{row.billsCount}</td>
                      <td className="py-3 px-3 text-right text-amber-400 font-bold">{formatINR(row.revenue)}</td>
                      <td className="py-3 px-3 text-right text-emerald-400">{formatINR(row.advance)}</td>
                      <td className="py-3 px-3 text-right text-rose-400">{formatINR(row.balanceDue)}</td>
                      <td className="py-3 px-3 text-right text-blue-300">{formatINR(row.gst)}</td>
                      <td className="py-3 px-3 text-center font-sans text-slate-300">{row.guests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. MONTHLY TABLE */}
            {activeTab === 'monthly' && (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-700">
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-3 text-center">Bills Count</th>
                    <th className="py-3 px-3 text-right">Monthly Revenue (₹)</th>
                    <th className="py-3 px-3 text-right">Advance (₹)</th>
                    <th className="py-3 px-3 text-right">Balance Due (₹)</th>
                    <th className="py-3 px-3 text-right">GST Collected (₹)</th>
                    <th className="py-3 px-3 text-center">Guests</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-mono">
                  {monthlyData.map((row) => (
                    <tr key={row.monthKey} className="hover:bg-slate-700/30 transition">
                      <td className="py-3 px-4 font-sans font-bold text-white text-sm">{row.monthLabel}</td>
                      <td className="py-3 px-3 text-center text-purple-300 font-bold">{row.billsCount}</td>
                      <td className="py-3 px-3 text-right text-amber-400 font-bold text-sm">{formatINR(row.revenue)}</td>
                      <td className="py-3 px-3 text-right text-emerald-400">{formatINR(row.advance)}</td>
                      <td className="py-3 px-3 text-right text-rose-400">{formatINR(row.balanceDue)}</td>
                      <td className="py-3 px-3 text-right text-blue-300">{formatINR(row.gst)}</td>
                      <td className="py-3 px-3 text-center font-sans text-slate-300">{row.guests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. INDIVIDUAL INVOICES TABLE */}
            {activeTab === 'invoices' && (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-700">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Invoice No</th>
                    <th className="py-3 px-3">Hotel Property</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-2">Room</th>
                    <th className="py-3 px-3 text-right">Net Total</th>
                    <th className="py-3 px-3 text-right">Balance Due</th>
                    <th className="py-3 px-2 text-center">Mode</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filteredBills.map((b) => (
                    <tr key={b.id || b._id} className="hover:bg-slate-700/30 transition">
                      <td className="py-2.5 px-3 text-slate-300">{b.billDate}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{b.invoiceNo}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">{b.hotelName}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        {b.customerName}
                        <div className="text-[10px] text-slate-400 font-mono">{b.customerPhone}</div>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-300">{b.roomNumber}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">₹ {formatINR(b.netTotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">₹ {formatINR(b.balanceDue)}</td>
                      <td className="py-2.5 px-2 text-center text-slate-400 text-[11px]">{b.paymentMode}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedBillForPreview(b)}
                            className="p-1 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded transition"
                            title="Inspect Bill"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBill(b.id || b._id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                            title="Delete Bill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </section>

      </main>

      {/* Bill Preview Modal for Admin */}
      {selectedBillForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-w-3xl w-full my-8 bg-white text-slate-900 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setSelectedBillForPreview(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-6 h-6" />
            </button>

            <InvoicePreview
              hotel={{
                name: selectedBillForPreview.hotelName,
                subText: selectedBillForPreview.hotelId === 'hotel-1' ? 'Organised by Maa Tara Enterprise' : 'Beach Resort & Hospitality',
                address: 'Digha, Purba Medinipur, West Bengal',
                phone: '9046926801',
                gstin: '19ABYFM7409E1Z0',
                themeColor: '#1a365d'
              }}
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
                amountInWords: selectedBillForPreview.amountInWords
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
