import React, { useState, useEffect } from 'react';
import BillingEngine from './BillingEngine';
import InvoicePreview from './InvoicePreview';
import ReportsAndTax from './ReportsAndTax';
import RoomSelectorModal from './RoomSelectorModal';
import { formatINR } from '../utils/numberToWords';
import { downloadInvoicePdf, printInvoicePdf } from '../utils/pdfExport';
import {
  Building2,
  Calendar,
  Clock,
  LogOut,
  BedDouble,
  FileText,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  PlusCircle,
  Archive,
  Search,
  Printer,
  Share2,
  Eye,
  RefreshCw,
  Edit3,
  Phone,
  User,
  Check,
  X,
  CreditCard,
  DollarSign,
  TrendingUp,
  Home,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  BookOpen,
  Info,
  Wallet,
  Banknote,
  QrCode,
  Receipt,
  FileSpreadsheet,
  Download,
  XCircle,
  CalendarX
} from 'lucide-react';

// Indian Standard Time (IST) Date string helper (YYYY-MM-DD)
// Guarantees strict 12:00:00 AM midnight reset without UTC displacement
export const getTodayStr = (d = new Date()) => {
  try {
    return new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  } catch {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
};

const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getTodayStr(d);
};

const getDayAfterTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return getTodayStr(d);
};

export default function ManagerWorkspace({ hotel, token, onLogout, onNavigateAdmin }) {
  // Navigation Tabs: 'activity' | 'billing' | 'rooms' | 'advance' | 'issues' | 'settlement' | 'reports'
  const [activeTab, setActiveTab] = useState('activity');

  // Help Modal State
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Billing Mode: 'hub' (Choice hub) | 'form' (Billing engine input & template) | 'closed' (Closed bills archive)
  const [billingMode, setBillingMode] = useState('hub');

  // Selected bill to edit in billing engine (null = create new blank bill)
  const [editingBill, setEditingBill] = useState(null);

  // Search filter for saved bills in hub right side
  const [savedSearchTerm, setSavedSearchTerm] = useState('');

  // Lists
  const [savedBills, setSavedBills] = useState([]);
  const [closedBills, setClosedBills] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [floors, setFloors] = useState({});
  const [advanceBookings, setAdvanceBookings] = useState([]);
  const [todayActivity, setTodayActivity] = useState(null);

  // Filters & Search
  const [closedSearchTerm, setClosedSearchTerm] = useState('');
  const [roomFilterDate, setRoomFilterDate] = useState(getTodayStr());
  const [roomStatusFilter, setRoomStatusFilter] = useState('all');

  // Modals
  const [selectedClosedBillForView, setSelectedClosedBillForView] = useState(null);
  const [issueModalRoom, setIssueModalRoom] = useState(null);
  const [newIssueText, setNewIssueText] = useState('');
  const [isSavingIssue, setIsSavingIssue] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Advance Booking Room Selector Modal State
  const [isAdvRoomSelectorOpen, setIsAdvRoomSelectorOpen] = useState(false);

  // Advance Booking Cancellation Modal State
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelForm, setCancelForm] = useState({
    type: 'REFUND',
    refundAmount: 0,
    refundMethod: 'UPI / QR',
    newCheckInDate: '',
    newCheckOutDate: '',
    reason: '',
    isSaving: false
  });

  // Advance Booking Form State
  const [advanceForm, setAdvanceForm] = useState({
    customerName: '',
    customerPhone: '',
    countryCode: '+91',
    idType: 'Aadhaar Card',
    idNumber: '',
    roomType: hotel.roomTypes?.[0]?.name || 'Standard Room',
    roomNumber: '',
    numPersons: 2,
    checkInDate: getTomorrowStr(),
    checkOutDate: getDayAfterTomorrowStr(),
    expectedDays: 2,
    advancePaid: 1000,
    paymentMode: 'UPI / QR',
    remarks: ''
  });
  const [advanceSuccessMsg, setAdvanceSuccessMsg] = useState('');

  // Live Animated Clock State & Strict 12:00 AM Midnight Auto-Reset
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    let lastDateStr = getTodayStr();

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Check if 12:00:00 AM Midnight has arrived (Date rollover in IST)
      const currentDayStr = getTodayStr(now);
      if (currentDayStr !== lastDateStr) {
        lastDateStr = currentDayStr;
        setRoomFilterDate(currentDayStr);
        loadWorkspaceData(); // Instantly resets collections to 0 & updates advance bookings to Reserved
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hotel?.hotelId]);

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Fetch all initial data
  const loadWorkspaceData = async () => {
    if (!hotel?.hotelId) return;
    setIsLoading(true);
    try {
      // 1. Fetch Today Activity
      const actRes = await fetch(`/api/activity/today?hotelId=${hotel.hotelId}`);
      const actData = await actRes.json();
      if (actData.success) setTodayActivity(actData.activity);

      // 2. Fetch Rooms
      const roomsRes = await fetch(`/api/rooms?hotelId=${hotel.hotelId}&date=${roomFilterDate}`);
      const roomsData = await roomsRes.json();
      if (roomsData.success) {
        setRooms(roomsData.rooms || []);
        setFloors(roomsData.floors || {});
      }

      // 3. Fetch Saved (Active in-house) Bills
      const savedRes = await fetch(`/api/bills?hotelId=${hotel.hotelId}&billStatus=SAVED`);
      const savedData = await savedRes.json();
      if (savedData.success) setSavedBills(savedData.bills || []);

      // 4. Fetch Closed (Past printed) Bills
      const closedRes = await fetch(`/api/bills?hotelId=${hotel.hotelId}&billStatus=CLOSED`);
      const closedData = await closedRes.json();
      if (closedData.success) setClosedBills(closedData.bills || []);

      // 5. Fetch Advance Bookings
      const advRes = await fetch(`/api/advance-bookings?hotelId=${hotel.hotelId}`);
      const advData = await advRes.json();
      if (advData.success) setAdvanceBookings(advData.bookings || []);
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [hotel?.hotelId, roomFilterDate]);

  // Handle Advance Booking Submit
  const handleCreateAdvanceBooking = async (e) => {
    e.preventDefault();
    if (!advanceForm.customerName || !advanceForm.checkInDate) {
      alert('Guest name and check-in date are required.');
      return;
    }

    try {
      const payload = {
        ...advanceForm,
        hotelId: hotel.hotelId,
        hotelName: hotel.name
      };

      const res = await fetch('/api/advance-bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setAdvanceSuccessMsg(`Advance booking for ${data.booking.customerName} saved! Room ${data.booking.roomNumber || 'assigned'}.`);
        setAdvanceForm({
          customerName: '',
          customerPhone: '',
          countryCode: '+91',
          idType: 'Aadhaar Card',
          idNumber: '',
          roomType: hotel.roomTypes?.[0]?.name || 'Standard Room',
          roomNumber: '',
          numPersons: 2,
          checkInDate: getTomorrowStr(),
          checkOutDate: getDayAfterTomorrowStr(),
          expectedDays: 2,
          advancePaid: 1000,
          paymentMode: 'UPI / QR',
          remarks: ''
        });
        loadWorkspaceData();
        setTimeout(() => setAdvanceSuccessMsg(''), 4500);
      } else {
        alert(data.message || 'Failed to save advance booking.');
      }
    } catch (err) {
      alert('Network error saving advance booking.');
    }
  };

  // Convert Advance Booking to Live Bill (Check-in Guest)
  const handleCheckInAdvanceGuest = async (booking) => {
    // 1. Immediately update status in database to 'CHECKED_IN'
    try {
      await fetch(`/api/advance-bookings/${booking.bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'CHECKED_IN' })
      });
    } catch (err) {
      console.warn('Could not update booking status:', err);
    }

    // 2. Remove from upcoming reservations view by updating state
    setAdvanceBookings(prev => prev.map(b => b.bookingId === booking.bookingId ? { ...b, status: 'CHECKED_IN' } : b));

    // 3. Set editing bill with all particulars for immediate check-in
    setEditingBill({
      invoiceNo: `${hotel.hotelId === 'hotel-1' ? 'HR' : hotel.hotelId === 'hotel-2' ? 'HSP' : 'HSP2'}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      billDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      customerName: booking.customerName,
      countryCode: booking.countryCode || '+91',
      customerPhone: booking.customerPhone,
      idType: booking.idType || 'Aadhaar Card',
      idNumber: booking.idNumber || '',
      roomType: booking.roomType,
      roomNumber: booking.roomNumber || '',
      numPersons: booking.numPersons || 2,
      checkInDateTime: `${getTodayStr()}T12:00`,
      checkOutDateTime: `${booking.checkOutDate}T11:00`,
      numDays: booking.expectedDays || 1,
      roomRentPerDay: hotel.roomTypes?.find(r => r.name === booking.roomType)?.defaultRent || 2000,
      extraCharges: 0,
      advancePaid: booking.advancePaid || 0,
      paymentMode: booking.paymentMode || 'UPI / QR',
      remarks: `Advance Booking ${booking.bookingId} checked in.`
    });

    setActiveTab('billing');
    setBillingMode('form');
    loadWorkspaceData();
  };

  // Open Cancellation Modal
  const handleOpenCancelModal = (booking) => {
    setSelectedBookingForCancel(booking);
    setCancelForm({
      type: 'REFUND',
      refundAmount: booking.advancePaid || 0,
      refundMethod: booking.paymentMode || 'UPI / QR',
      newCheckInDate: booking.checkInDate || getTomorrowStr(),
      newCheckOutDate: booking.checkOutDate || getDayAfterTomorrowStr(),
      reason: '',
      isSaving: false
    });
  };

  // Confirm Cancellation / Reschedule
  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;
    setCancelForm(prev => ({ ...prev, isSaving: true }));

    try {
      let updatePayload = {};

      if (cancelForm.type === 'DATE_CHANGE') {
        updatePayload = {
          checkInDate: cancelForm.newCheckInDate,
          checkOutDate: cancelForm.newCheckOutDate,
          remarks: `${selectedBookingForCancel.remarks || ''} [Rescheduled to ${cancelForm.newCheckInDate}]`.trim(),
          status: 'RESERVED'
        };
      } else {
        let reasonText = '';
        if (cancelForm.type === 'REFUND') {
          reasonText = `Refunded ₹${cancelForm.refundAmount} via ${cancelForm.refundMethod}${cancelForm.reason ? ` (${cancelForm.reason})` : ''}`;
        } else {
          reasonText = cancelForm.reason || 'Cancelled by guest request';
        }

        updatePayload = {
          status: 'CANCELLED',
          cancellationType: cancelForm.type,
          cancellationReason: reasonText,
          refundAmount: cancelForm.type === 'REFUND' ? cancelForm.refundAmount : 0,
          refundMethod: cancelForm.type === 'REFUND' ? cancelForm.refundMethod : '',
          roomNumber: '', // Free up room immediately so room matrix turns Green
          cancelledAt: new Date().toISOString()
        };
      }

      const res = await fetch(`/api/advance-bookings/${selectedBookingForCancel.bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
      });

      const data = await res.json();
      if (data.success) {
        setAdvanceBookings(prev => prev.map(b => 
          b.bookingId === selectedBookingForCancel.bookingId ? { ...b, ...updatePayload } : b
        ));
        setSelectedBookingForCancel(null);
        loadWorkspaceData();
      } else {
        alert(data.message || 'Failed to update reservation.');
      }
    } catch (err) {
      alert('Network error updating reservation.');
    } finally {
      setCancelForm(prev => ({ ...prev, isSaving: false }));
    }
  };

  // Add issue to room
  const handleSaveRoomIssue = async () => {
    if (!newIssueText.trim() || !issueModalRoom) return;
    setIsSavingIssue(true);
    try {
      const res = await fetch(`/api/rooms/${issueModalRoom.roomNumber}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          hotelId: hotel.hotelId,
          issueText: newIssueText.trim(),
          reportedBy: 'Manager'
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewIssueText('');
        setIssueModalRoom(null);
        loadWorkspaceData();
      } else {
        alert(data.message || 'Failed to report issue.');
      }
    } catch {
      alert('Error reporting issue.');
    } finally {
      setIsSavingIssue(false);
    }
  };

  // Fix room issue
  const handleFixRoomIssue = async (roomNumber, issueId = null) => {
    try {
      const res = await fetch(`/api/rooms/${roomNumber}/issues/fix`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ hotelId: hotel.hotelId, issueId })
      });
      const data = await res.json();
      if (data.success) {
        setIssueModalRoom(null);
        loadWorkspaceData();
      }
    } catch {
      alert('Error fixing issue.');
    }
  };

  // Filtered Closed Bills
  const filteredClosedBills = closedBills.filter(b => {
    const q = closedSearchTerm.toLowerCase();
    return (
      b.customerName?.toLowerCase().includes(q) ||
      b.invoiceNo?.toLowerCase().includes(q) ||
      b.customerPhone?.includes(q) ||
      b.roomNumber?.includes(q)
    );
  });

  // Filtered Saved (In-House Active) Bills for Hub
  const filteredSavedBills = savedBills.filter(b => {
    const q = savedSearchTerm.toLowerCase();
    return (
      b.customerName?.toLowerCase().includes(q) ||
      b.invoiceNo?.toLowerCase().includes(q) ||
      b.customerPhone?.includes(q) ||
      b.roomNumber?.includes(q) ||
      b.roomType?.toLowerCase().includes(q)
    );
  });

  // =========================================================
  // REVENUE & DAILY SETTLEMENT (MANAGER VIEW)
  // Dynamic Real-time Calculations for Today's Collections & Pending Balances
  // Strictly scoped to 12:00:00 AM - 11:59:59 PM in Indian Standard Time (IST)
  // =========================================================
  const todayStr = getTodayStr();

  // 1. Pending Balances across all currently checked-in guests
  const pendingGuestsList = savedBills
    .map(b => {
      const net = parseFloat(b.netTotal) || 0;
      const adv = parseFloat(b.advancePaid) || 0;
      const balanceDue = Math.max(0, net - adv);
      return {
        ...b,
        net,
        adv,
        balanceDue
      };
    })
    .filter(b => b.balanceDue > 0);

  const pendingBalanceTotal = pendingGuestsList.reduce((sum, b) => sum + b.balanceDue, 0);

  // 2. Today's Collections (Cash vs. UPI vs. Card)
  let todayCash = 0;
  let todayUPI = 0;
  let todayCard = 0;
  let todayOther = 0;
  const todayTransactions = [];

  // A. From Closed Bills (Settled today upon checkout)
  closedBills.forEach(b => {
    const rawDt = b.checkedOutAt || b.billDateTime || b.createdAt;
    try {
      const isToday = getTodayStr(rawDt) === todayStr;
      if (isToday) {
        const amt = parseFloat(b.netTotal) || 0;
        const mode = (b.paymentMode || '').toUpperCase();
        if (mode.includes('CASH')) todayCash += amt;
        else if (mode.includes('UPI') || mode.includes('QR')) todayUPI += amt;
        else if (mode.includes('CARD') || mode.includes('DEBIT') || mode.includes('CREDIT')) todayCard += amt;
        else todayOther += amt;

        todayTransactions.push({
          type: 'Closed Bill Settlement',
          invoiceNo: b.invoiceNo,
          customerName: b.customerName,
          roomNumber: b.roomNumber,
          paymentMode: b.paymentMode || 'PAID',
          amount: amt,
          time: new Date(rawDt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch { }
  });

  // B. From Active Saved Bills created today (Advance deposits collected at check-in)
  savedBills.forEach(b => {
    const rawDt = b.billDateTime || b.createdAt;
    try {
      const isToday = getTodayStr(rawDt) === todayStr;
      if (isToday) {
        const adv = parseFloat(b.advancePaid) || 0;
        if (adv > 0) {
          const mode = (b.paymentMode || '').toUpperCase();
          if (mode.includes('CASH')) todayCash += adv;
          else if (mode.includes('UPI') || mode.includes('QR')) todayUPI += adv;
          else if (mode.includes('CARD') || mode.includes('DEBIT') || mode.includes('CREDIT')) todayCard += adv;
          else todayOther += adv;

          todayTransactions.push({
            type: 'Check-in Advance Deposit',
            invoiceNo: b.invoiceNo,
            customerName: b.customerName,
            roomNumber: b.roomNumber,
            paymentMode: b.paymentMode || 'Advance',
            amount: adv,
            time: new Date(rawDt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      }
    } catch { }
  });

  // C. From Advance Bookings created today (Advance deposits collected in advance)
  advanceBookings.forEach(ab => {
    if (ab.status !== 'CANCELLED') {
      try {
        const isToday = getTodayStr(ab.createdAt) === todayStr;
        if (isToday) {
          const adv = parseFloat(ab.advancePaid) || 0;
          if (adv > 0) {
            const mode = (ab.paymentMode || '').toUpperCase();
            if (mode.includes('CASH')) todayCash += adv;
            else if (mode.includes('UPI') || mode.includes('QR')) todayUPI += adv;
            else if (mode.includes('CARD') || mode.includes('DEBIT') || mode.includes('CREDIT')) todayCard += adv;
            else todayOther += adv;

            todayTransactions.push({
              type: 'Advance Reservation Deposit',
              invoiceNo: ab.bookingId,
              customerName: ab.customerName,
              roomNumber: ab.roomNumber || 'Advance',
              paymentMode: ab.paymentMode || 'Advance',
              amount: adv,
              time: new Date(ab.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
        }
      } catch { }
    }
  });

  // Server settlement fallback if local bills list is empty or partially loaded
  const serverSettlement = todayActivity?.settlement;
  const finalCash = Math.max(todayCash, serverSettlement?.cashCollection || 0);
  const finalUPI = Math.max(todayUPI, serverSettlement?.upiCollection || 0);
  const finalCard = Math.max(todayCard, serverSettlement?.cardCollection || 0);
  const finalOther = Math.max(todayOther, serverSettlement?.otherCollection || 0);
  const finalTotalCollections = finalCash + finalUPI + finalCard + finalOther;
  const finalPendingTotal = pendingBalanceTotal > 0 ? pendingBalanceTotal : (serverSettlement?.pendingBalanceTotal || 0);
  const finalPendingCount = pendingGuestsList.length > 0 ? pendingGuestsList.length : (serverSettlement?.pendingGuestsCount || 0);
  const finalPendingList = pendingGuestsList.length > 0 ? pendingGuestsList : (serverSettlement?.pendingGuestsList || []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">

      {/* ========================================================= */}
      {/* 1. TOP HEADER: Property Logo, Title, Clock, Help, Logout  */}
      {/* ========================================================= */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">

          {/* Left: Active Hotel Title & Badge */}
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: hotel.themeColor || '#1a365d' }}
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-serif font-bold text-xl shadow-sm flex-shrink-0"
            >
              {hotel.name?.charAt(0) || 'H'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {hotel.name}
                </h1>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Manager Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
                {hotel.subText} &bull; {hotel.phone}
              </p>
            </div>
          </div>

          {/* Right: Clock Widget, Help Button, Logout Button */}
          <div className="flex items-center gap-2.5 sm:gap-3">

            {/* Clock Widget */}
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center relative">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9.5" strokeWidth="1.8" />
                  <line x1="12" y1="12" x2="12" y2="7.5" strokeWidth="2.2" className="stroke-blue-700" style={{ transformOrigin: '12px 12px', animation: 'spin 16s linear infinite' }} />
                  <line x1="12" y1="12" x2="16" y2="12" strokeWidth="1.8" className="stroke-blue-500" style={{ transformOrigin: '12px 12px', animation: 'spin 3s linear infinite' }} />
                  <circle cx="12" cy="12" r="1.2" className="fill-blue-600 stroke-none" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-mono text-xs font-extrabold text-slate-800 leading-none">{formattedTime}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{formattedDate}</div>
              </div>
            </div>

            {/* Help Page Button (Added to Header per User Request) */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Open Operations Guide & Help"
            >
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Help</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Logout from manager portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. UNDER HEADER: Dedicated Navigation Bar for Features     */}
      {/* (Create Bill, Room Status, Advance Booking, Rooms Issue...)*/}
      {/* ========================================================= */}
      <div className="bg-white border-b border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sticky top-[61px] z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">

            {/* 1. Home */}
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'activity'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            {/* 2. Create Bill (Billing & Invoices) */}
            <button
              onClick={() => { setActiveTab('billing'); setBillingMode('hub'); }}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'billing'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
            >
              <FileText className="w-4 h-4" />
              <span>Create Bill</span>
              {savedBills.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === 'billing' ? 'bg-white text-blue-700' : 'bg-emerald-500 text-white'
                  }`}>
                  {savedBills.length}
                </span>
              )}
            </button>

            {/* 3. Room Status (Room Available by Floor) */}
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'rooms'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
            >
              <BedDouble className="w-4 h-4" />
              <span>Room Status</span>
            </button>

            {/* 4. Advance Booking */}
            <button
              onClick={() => setActiveTab('advance')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'advance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Advance Booking</span>
              {advanceBookings.filter(b => b.status !== 'CHECKED_IN' && b.status !== 'CANCELLED').length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === 'advance' ? 'bg-white text-blue-700' : 'bg-amber-500 text-white'
                  }`}>
                  {advanceBookings.filter(b => b.status !== 'CHECKED_IN' && b.status !== 'CANCELLED').length}
                </span>
              )}
            </button>

            {/* 5. Rooms Issue */}
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'issues'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Rooms Issue</span>
            </button>

            {/* 6. Daily Settlement (Financial Section) */}
            <button
              onClick={() => setActiveTab('settlement')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'settlement'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Daily Settlement</span>
              {finalPendingTotal > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === 'settlement' ? 'bg-white text-blue-700' : 'bg-amber-500 text-white'
                  }`}>
                  ₹{formatINR(finalPendingTotal)}
                </span>
              )}
            </button>

            {/* 7. Reports & Tax */}
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Reports & Tax</span>
            </button>

          </nav>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA BY ACTIVE TAB                           */}
      {/* ========================================================= */}
      <main className={`flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 print:p-0 print:m-0 print:max-w-none ${selectedClosedBillForView ? 'no-print' : ''}`}>

        {/* --------------------------------------------------------- */}
        {/* TAB 1: HOME VIEW (OPERATIONS & DAILY REVENUE)             */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'activity' && (
          <div className="space-y-6 animate-fade-in">

            {/* Financial Collections Strip (Today's Collections & Pending Balances) */}
            <div className="bg-white text-slate-800 rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 no-print">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">

                {/* Left: Collections Pillar with Cash vs UPI vs Card Breakdown */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-5">

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block leading-none">
                        Today's Collections
                      </span>
                      <span className="font-mono text-base sm:text-lg font-extrabold text-slate-900">
                        ₹{formatINR(finalTotalCollections)}
                      </span>
                    </div>
                  </div>

                  <div className="h-7 w-[1px] bg-slate-200 hidden sm:block"></div>

                  {/* Collections Breakdown: Cash vs UPI vs Card */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-50/80 border border-emerald-200 text-[11px] flex items-center gap-1.5" title="Cash collections today">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-emerald-800 font-medium">Cash:</span>
                      <span className="font-mono font-bold text-emerald-700">₹{formatINR(finalCash)}</span>
                    </div>

                    <div className="px-2.5 py-1 rounded-lg bg-blue-50/80 border border-blue-200 text-[11px] flex items-center gap-1.5" title="UPI / QR collections today">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="text-blue-800 font-medium">UPI:</span>
                      <span className="font-mono font-bold text-blue-700">₹{formatINR(finalUPI)}</span>
                    </div>

                    <div className="px-2.5 py-1 rounded-lg bg-purple-50/80 border border-purple-200 text-[11px] flex items-center gap-1.5" title="Card collections today">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span className="text-purple-800 font-medium">Card:</span>
                      <span className="font-mono font-bold text-purple-700">₹{formatINR(finalCard)}</span>
                    </div>
                  </div>

                </div>

                {/* Right: Pending Balances across all checked-in guests */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 md:pt-0 border-t border-slate-100 md:border-t-0">

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block leading-none">
                        Pending Balances (Active Stays)
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="font-mono text-base sm:text-lg font-extrabold text-amber-700">
                          ₹{formatINR(finalPendingTotal)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({finalPendingCount} {finalPendingCount === 1 ? 'guest' : 'guests'})
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('settlement')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer shadow-sm ${activeTab === 'settlement'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300'
                      }`}
                    title="View Full Daily Settlement Sheet & Audit"
                  >
                    <span>Settlement Sheet &rarr;</span>
                  </button>

                </div>

              </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Rooms</div>
                <div className="font-mono text-2xl font-extrabold text-slate-900 mt-1">{todayActivity?.totalRooms || 15}</div>
                <div className="text-[11px] text-slate-400 mt-1">Across 3 Floors</div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm">
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Available
                </div>
                <div className="font-mono text-2xl font-extrabold text-emerald-600 mt-1">{todayActivity?.availableCount || 0}</div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">Clean & Ready</div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-sm">
                <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Occupied
                </div>
                <div className="font-mono text-2xl font-extrabold text-rose-600 mt-1">{todayActivity?.occupiedCount || 0}</div>
                <div className="text-[11px] text-rose-600 font-medium mt-1">In-House Guests</div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm">
                <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Reserved
                </div>
                <div className="font-mono text-2xl font-extrabold text-amber-600 mt-1">{todayActivity?.reservedCount || 0}</div>
                <div className="text-[11px] text-amber-600 font-medium mt-1">Arriving Today</div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span> Cleaning
                </div>
                <div className="font-mono text-2xl font-extrabold text-slate-700 mt-1">{todayActivity?.maintenanceCount || 0}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">30m Housekeeping</div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-sm">
                <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Occupancy</div>
                <div className="font-mono text-2xl font-extrabold text-blue-600 mt-1">{todayActivity?.occupancyPercentage || 0}%</div>
                <div className="text-[11px] text-blue-600 font-medium mt-1">Current Ratio</div>
              </div>

            </div>

            {/* Quick Action Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-300" />
                  <span>New Guest Check-in</span>
                </h3>
                <p className="text-xs text-blue-100 mt-1">
                  Select an available room from the live room status matrix to check in a guest and create their bill.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setActiveTab('rooms')}
                  className="px-4 py-2 bg-white text-blue-800 text-xs font-bold rounded-xl shadow hover:bg-blue-50 transition cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4 text-blue-700" />
                  <span>+ New Guest Check-in (Select Room)</span>
                </button>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 border border-white/20 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <BedDouble className="w-4 h-4" />
                  <span>View Room Status</span>
                </button>
              </div>
            </div>

            {/* Split Tables: In-House Guests vs Today Arrivals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left: In-House Active Guests */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>In-House Active Guests ({savedBills.length})</span>
                  </h3>
                  <button
                    onClick={() => { setActiveTab('billing'); setBillingMode('hub'); }}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    View All &rarr;
                  </button>
                </div>

                {savedBills.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">No active in-house guests currently.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {savedBills.slice(0, 5).map(b => (
                      <div key={b.invoiceNo || b.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              Room {b.roomNumber}
                            </span>
                            <span className="font-bold text-slate-800">{b.customerName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Check-in: {b.checkInDateTime?.slice(0, 10)} &bull; {b.roomType}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-800">₹{formatINR(b.netTotal)}</div>
                          <button
                            onClick={() => { setEditingBill(b); setActiveTab('billing'); setBillingMode('form'); }}
                            className="text-[11px] font-semibold text-blue-600 hover:underline mt-0.5"
                          >
                            Open & Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Upcoming / Today's Expected Arrivals */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                {(() => {
                  const upcomingActive = advanceBookings.filter(adv => adv.status !== 'CHECKED_IN' && adv.status !== 'CANCELLED');
                  return (
                    <>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          <span>Advance Reservations ({upcomingActive.length})</span>
                        </h3>
                        <button
                          onClick={() => setActiveTab('advance')}
                          className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                        >
                          Manage &rarr;
                        </button>
                      </div>

                      {upcomingActive.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs">No active advance reservations.</div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {upcomingActive.slice(0, 5).map(adv => (
                            <div key={adv.bookingId} className="py-2.5 flex items-center justify-between text-xs">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800">{adv.customerName}</span>
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    Arrives: {adv.checkInDate}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {adv.roomType} {adv.roomNumber ? `(Room ${adv.roomNumber})` : ''} &bull; Adv: ₹{formatINR(adv.advancePaid)}
                                </div>
                              </div>

                              <button
                                onClick={() => handleCheckInAdvanceGuest(adv)}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition cursor-pointer"
                              >
                                Check-in
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

            </div>

          </div>
        )}


        {/* --------------------------------------------------------- */}
        {/* TAB 2: CREATE BILL / BILLING HUB                          */}
        {/* Step 1: Choice Hub (Left: Create New & Closed Bills; Right: All Saved Bills) */}
        {/* Step 2: Form View (Billing Inputs & Live Receipt Template) */}
        {/* Step 3: Closed Archive View                                */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'billing' && (
          <div className="space-y-6 animate-fade-in">

            {/* ======================================================= */}
            {/* 1. SELECTION & CHOICE HUB (billingMode === 'hub')       */}
            {/* Left: Create New Bill & Closed Bills                     */}
            {/* Right: All In-House Saved Bills (Active Stays)          */}
            {/* ======================================================= */}
            {billingMode === 'hub' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN: Options (Create New Bill & Closed Bills) */}
                <div className="lg:col-span-4 space-y-4">

                  {/* Card 1: Create New Bill (Light Blue) */}
                  <div
                    onClick={() => { setEditingBill(null); setBillingMode('form'); }}
                    className="bg-blue-50/90 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 p-6 rounded-2xl shadow-sm hover:shadow transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition flex-shrink-0">
                        <PlusCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-blue-950 group-hover:text-blue-700 transition">
                          Create New Bill
                        </h3>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition shadow-xs">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Card 2: Closed Bills (Light Ash Color) */}
                  <div
                    onClick={() => setBillingMode('closed')}
                    className="bg-slate-100 hover:bg-slate-200/90 border border-slate-200 hover:border-slate-300 p-6 rounded-2xl shadow-sm hover:shadow transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition flex-shrink-0">
                        <Archive className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-slate-800 transition">
                          Closed Bills
                        </h3>
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-300 shadow-sm">
                          {closedBills.length}
                        </span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-white text-slate-700 flex items-center justify-center group-hover:bg-slate-700 group-hover:text-white border border-slate-200 transition shadow-xs">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: All Saved Bills */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-slate-900">In-House Saved Bills</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                          {savedBills.length} Active Stays
                        </span>
                      </div>
                    </div>

                    {/* Search Saved Bills */}
                    <div className="relative max-w-xs w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={savedSearchTerm}
                        onChange={(e) => setSavedSearchTerm(e.target.value)}
                        placeholder="Search by guest, room, phone..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {filteredSavedBills.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl p-8 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <BedDouble className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-700">No In-House Saved Bills Found</h4>
                      {savedSearchTerm && (
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          No active bills match "{savedSearchTerm}".
                        </p>
                      )}
                      {!savedSearchTerm && (
                        <button
                          onClick={() => { setEditingBill(null); setBillingMode('form'); }}
                          className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
                        >
                          + Create First Bill
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
                      {filteredSavedBills.map(b => (
                        <div
                          key={b.invoiceNo || b.id}
                          onClick={() => { setEditingBill(b); setBillingMode('form'); }}
                          className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md bg-slate-50/60 hover:bg-white transition cursor-pointer flex flex-col justify-between group space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-sm font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                                Room {b.roomNumber}
                              </span>
                              <span className="font-mono text-[11px] font-bold text-slate-500">
                                {b.invoiceNo}
                              </span>
                            </div>

                            <div className="mt-2.5">
                              <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition">
                                {b.customerName || 'Guest'}
                              </h4>
                              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{b.customerPhone || 'N/A'}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 truncate">
                                {b.roomType} &bull; {b.numDays || 1} day(s) stay
                              </div>
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total Amount</span>
                              <span className="font-mono text-sm font-extrabold text-slate-900">
                                ₹{formatINR(b.netTotal)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingBill(b);
                                setBillingMode('form');
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-white group-hover:bg-blue-600 group-hover:text-white rounded-lg border border-blue-200 group-hover:border-blue-600 transition flex items-center gap-1 shadow-sm"
                            >
                              <span>Edit Bill</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* ======================================================= */}
            {/* 2. BILLING FORM & TEMPLATE (billingMode === 'form')     */}
            {/* Shown ONLY AFTER clicking Create New Bill or a Saved Bill */}
            {/* ======================================================= */}
            {billingMode === 'form' && (
              <div className="space-y-4 animate-fade-in">

                {/* Navigation Top Bar: Back to Choice Hub */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setEditingBill(null); setBillingMode('hub'); }}
                      className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <ArrowLeft className="w-4 h-4 text-slate-600" />
                      <span>← Back to Bills Hub</span>
                    </button>

                    <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{editingBill ? 'Edit In-House Bill' : 'Create New Bill'}</span>
                        {editingBill ? (
                          <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {editingBill.invoiceNo} (Room {editingBill.roomNumber})
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Fresh Guest Check-in
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {editingBill
                          ? `Guest: ${editingBill.customerName} • Modify particulars, save changes, or checkout & print.`
                          : 'Fill in guest particulars, select room from inventory, and print/save invoice.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingBill && (
                      <button
                        onClick={() => setEditingBill(null)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl transition cursor-pointer"
                      >
                        + Switch to Blank New Bill
                      </button>
                    )}
                    <button
                      onClick={() => setBillingMode('closed')}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition flex items-center gap-1"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Closed Bills ({closedBills.length})</span>
                    </button>
                  </div>
                </div>

                {/* Billing Input Box & Live Receipt Template */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 print:border-none print:shadow-none print:p-0 print:m-0 print:bg-transparent">
                  <BillingEngine
                    hotel={hotel}
                    token={token}
                    onLogout={onLogout}
                    initialBillData={editingBill}
                    onSaveSuccess={(saved) => {
                      loadWorkspaceData();
                      setEditingBill(saved);
                    }}
                    onCheckoutSuccess={() => {
                      loadWorkspaceData();
                      setEditingBill(null);
                      setBillingMode('closed');
                    }}
                  />
                </div>

              </div>
            )}

            {/* ======================================================= */}
            {/* 3. CLOSED BILLS ARCHIVE (billingMode === 'closed')       */}
            {/* Checked-out bills with Print & WhatsApp options         */}
            {/* ======================================================= */}
            {billingMode === 'closed' && (
              <div className="space-y-4 animate-fade-in">

                {/* Navigation Top Bar: Back to Choice Hub */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setBillingMode('hub')}
                      className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <ArrowLeft className="w-4 h-4 text-slate-600" />
                      <span>← Back to Bills Hub</span>
                    </button>

                    <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Closed Bills (Checked-Out Archive)</h3>
                      <p className="text-[11px] text-slate-500">Past finalized bills with instant Print and WhatsApp share</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingBill(null); setBillingMode('form'); }}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Create New Bill</span>
                    </button>
                  </div>
                </div>

                {/* Closed Bills Archive Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Historical Invoices Directory</h4>
                      <p className="text-xs text-slate-500">Total {closedBills.length} checked-out invoices stored in database</p>
                    </div>

                    <div className="relative max-w-xs w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={closedSearchTerm}
                        onChange={(e) => setClosedSearchTerm(e.target.value)}
                        placeholder="Search by guest, invoice #, phone..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {filteredClosedBills.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">No closed bills matching your query.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                            <th className="py-2.5 px-3">Invoice No</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Guest</th>
                            <th className="py-2.5 px-3">Room</th>
                            <th className="py-2.5 px-3">Net Total</th>
                            <th className="py-2.5 px-3">Payment</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredClosedBills.map(b => (
                            <tr key={b.invoiceNo || b.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-3 font-mono font-bold text-blue-700">{b.invoiceNo}</td>
                              <td className="py-3 px-3 text-slate-600">{b.billDate || b.createdAt?.slice(0, 10)}</td>
                              <td className="py-3 px-3 font-medium text-slate-800">{b.customerName}</td>
                              <td className="py-3 px-3 font-mono font-semibold text-slate-700">Room {b.roomNumber}</td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-900">₹{formatINR(b.netTotal)}</td>
                              <td className="py-3 px-3">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {b.paymentMode || 'PAID'}
                                </span>
                                {b.isNonGST && (
                                  <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                                    Non-GST
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => setSelectedClosedBillForView(b)}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                                  title="View Receipt Preview"
                                >
                                  <Eye className="w-3 h-3 text-slate-500" />
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedClosedBillForView(b);
                                    setTimeout(() => window.print(), 300);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-slate-800 hover:bg-black rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                                  title="Print Receipt"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Print</span>
                                </button>
                                <button
                                  onClick={() => {
                                    const clean = (b.customerPhone || '').replace(/\D/g, '');
                                    const msg = `🏨 *${hotel.name} - INVOICE ${b.invoiceNo}*\nGuest: ${b.customerName}\nRoom: ${b.roomNumber}\nTotal: ₹${formatINR(b.netTotal)}\nStatus: PAID\nThank you for choosing ${hotel.name}!`;
                                    window.open(`https://wa.me/91${clean}?text=${encodeURIComponent(msg)}`, '_blank');
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                                  title="Share on WhatsApp"
                                >
                                  <Share2 className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}


        {/* --------------------------------------------------------- */}
        {/* TAB 3: ROOM STATUS (Floor by Floor with Live Color Flags) */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'rooms' && (
          <div className="space-y-6 animate-fade-in">

            {/* Control Bar: Date Selector & Color Legend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">

              {/* Date Filter (To inspect rooms for today or future dates!) */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-slate-700">Check Date Availability:</span>
                <input
                  type="date"
                  value={roomFilterDate}
                  onChange={(e) => setRoomFilterDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {roomFilterDate !== new Date().toISOString().slice(0, 10) && (
                  <button
                    onClick={() => setRoomFilterDate(new Date().toISOString().slice(0, 10))}
                    className="text-[11px] text-blue-600 hover:underline font-bold"
                  >
                    Reset to Today
                  </button>
                )}
              </div>

              {/* Status Flags Color Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Green: Available
                </span>
                <span className="flex items-center gap-1.5 font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Red: Occupied
                </span>
                <span className="flex items-center gap-1.5 font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Yellow: Reserved
                </span>
                <span className="flex items-center gap-1.5 font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Grey: Cleaning (30m)
                </span>
              </div>

            </div>

            {/* Floor by Floor Room Grid */}
            <div className="space-y-6">
              {Object.keys(floors).length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">No rooms found.</div>
              ) : (
                Object.keys(floors).map(floorNum => (
                  <div key={floorNum} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-extrabold rounded-lg uppercase tracking-wider">
                          Floor {floorNum}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({floors[floorNum].length} Rooms)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                      {floors[floorNum].map(room => {
                        const hasIssues = room.activeIssues && room.activeIssues.length > 0;

                        let cardStyle = 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:border-emerald-500';
                        let badgeStyle = 'bg-emerald-600 text-white';
                        let flagLabel = 'Available';

                        if (room.displayStatus === 'occupied') {
                          cardStyle = 'bg-rose-50 border-rose-300 text-rose-950 hover:border-rose-500';
                          badgeStyle = 'bg-rose-600 text-white';
                          flagLabel = 'Occupied';
                        } else if (room.displayStatus === 'reserved') {
                          cardStyle = 'bg-amber-50 border-amber-300 text-amber-950 hover:border-amber-500';
                          badgeStyle = 'bg-amber-500 text-white';
                          flagLabel = 'Reserved';
                        } else if (room.displayStatus === 'maintenance') {
                          cardStyle = 'bg-slate-100 border-slate-300 text-slate-800 hover:border-slate-400';
                          badgeStyle = 'bg-slate-500 text-white';
                          flagLabel = `${room.maintenanceRemainingMins || 30}m Cleaning`;
                        }

                        return (
                          <div
                            key={room.roomNumber}
                            className={`p-3.5 rounded-xl border flex flex-col justify-between transition shadow-sm ${cardStyle}`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-mono text-lg font-extrabold">{room.roomNumber}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeStyle}`}>
                                  {flagLabel}
                                </span>
                              </div>

                              <div className="text-xs font-semibold truncate">{room.roomType}</div>
                              <div className="text-[11px] font-mono text-slate-600 mt-0.5">₹{room.defaultRent}/day</div>

                              {/* Guest Name if Occupied */}
                              {room.displayStatus === 'occupied' && (
                                <div className="mt-2 pt-2 border-t border-rose-200/60 text-[11px] font-medium text-rose-900 truncate">
                                  👤 {room.currentGuestName || 'Checked-in'}
                                </div>
                              )}

                              {/* Advance Booking if Reserved */}
                              {room.displayStatus === 'reserved' && (
                                <div className="mt-2 pt-2 border-t border-amber-200/60 text-[11px] font-medium text-amber-900 truncate">
                                  📅 {room.advanceBooking?.customerName || 'Reserved'}
                                </div>
                              )}

                              {/* Defect Warning */}
                              {hasIssues && (
                                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 truncate">
                                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{room.activeIssues[0].issue}</span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between gap-1">
                              {room.displayStatus === 'available' && (
                                <button
                                  onClick={() => {
                                    setEditingBill({
                                      invoiceNo: `${hotel.hotelId === 'hotel-1' ? 'HR' : hotel.hotelId === 'hotel-2' ? 'HSP' : 'HSP2'}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                                      billDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                                      customerName: '',
                                      customerPhone: '',
                                      countryCode: '+91',
                                      idType: 'Aadhaar Card',
                                      idNumber: '',
                                      roomType: room.roomType,
                                      roomNumber: room.roomNumber,
                                      numPersons: 2,
                                      checkInDateTime: `${new Date().toISOString().slice(0, 10)}T12:00`,
                                      checkOutDateTime: `${new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10)}T11:00`,
                                      numDays: 1,
                                      roomRentPerDay: room.defaultRent,
                                      extraCharges: 0,
                                      advancePaid: 0,
                                      paymentMode: 'Cash'
                                    });
                                    setActiveTab('billing');
                                    setBillingMode('form');
                                  }}
                                  className="w-full py-1 text-[10px] font-bold text-emerald-800 bg-white hover:bg-emerald-100 rounded border border-emerald-300 transition text-center cursor-pointer"
                                >
                                  + Assign & Bill
                                </button>
                              )}

                              {room.displayStatus === 'reserved' && (
                                <button
                                  onClick={() => handleCheckInAdvanceGuest(room.advanceBooking)}
                                  className="w-full py-1 text-[10px] font-bold text-amber-800 bg-white hover:bg-amber-100 rounded border border-amber-300 transition text-center cursor-pointer"
                                >
                                  Check-in Guest
                                </button>
                              )}

                              {room.displayStatus === 'occupied' && (
                                <button
                                  onClick={async () => {
                                    // 1. Find matching bill across single or multiple room bookings
                                    let b = savedBills.find(bill => {
                                      if (room.currentBillId && (bill._id === room.currentBillId || bill.id === room.currentBillId)) return true;
                                      if (room.currentInvoiceNo && bill.invoiceNo === room.currentInvoiceNo) return true;
                                      if (bill.roomNumber) {
                                        const rList = String(bill.roomNumber).split(',').map(s => s.trim());
                                        if (rList.includes(room.roomNumber)) return true;
                                      }
                                      if (bill.selectedRooms && bill.selectedRooms.some(sr => sr.roomNumber === room.roomNumber)) return true;
                                      return false;
                                    });

                                    // 2. Fallback: fetch from API if not yet in state
                                    if (!b) {
                                      try {
                                        const res = await fetch(`/api/bills?hotelId=${hotel.hotelId}&billStatus=SAVED`);
                                        const data = await res.json();
                                        if (data.success && data.bills) {
                                          b = data.bills.find(bill => {
                                            if (room.currentBillId && (bill._id === room.currentBillId || bill.id === room.currentBillId)) return true;
                                            if (room.currentInvoiceNo && bill.invoiceNo === room.currentInvoiceNo) return true;
                                            const rList = String(bill.roomNumber || '').split(',').map(s => s.trim());
                                            return rList.includes(room.roomNumber);
                                          });
                                        }
                                      } catch (err) {
                                        console.error('Error finding bill for room:', err);
                                      }
                                    }

                                    if (b) {
                                      const bookedRooms = String(b.roomNumber || '').split(',').map(s => s.trim()).filter(Boolean);
                                      if (bookedRooms.length > 1) {
                                        alert(`Multi-Room Booking Detected:\nGuest "${b.customerName || 'In-House'}" currently occupies ${bookedRooms.length} rooms: [${bookedRooms.join(', ')}].\nOpening bill for checkout and settlement.`);
                                      }
                                      setEditingBill(b);
                                      setActiveTab('billing');
                                      setBillingMode('form');
                                    } else {
                                      alert(`Active bill for Room ${room.roomNumber} (${room.currentGuestName || 'Guest'}) could not be located.`);
                                    }
                                  }}
                                  className="w-full py-1 text-[10px] font-bold text-rose-800 bg-white hover:bg-rose-100 rounded border border-rose-300 transition text-center cursor-pointer"
                                >
                                  Open Bill & Checkout
                                </button>
                              )}

                              {room.displayStatus === 'maintenance' && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Force assign Room ${room.roomNumber} early (Housekeeping has ${room.maintenanceRemainingMins || 30} mins remaining)?`)) {
                                      setEditingBill({
                                        invoiceNo: `${hotel.hotelId === 'hotel-1' ? 'HR' : hotel.hotelId === 'hotel-2' ? 'HSP' : 'HSP2'}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                                        billDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                                        customerName: '',
                                        customerPhone: '',
                                        countryCode: '+91',
                                        idType: 'Aadhaar Card',
                                        idNumber: '',
                                        roomType: room.roomType,
                                        roomNumber: room.roomNumber,
                                        numPersons: 2,
                                        checkInDateTime: `${new Date().toISOString().slice(0, 10)}T12:00`,
                                        checkOutDateTime: `${new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10)}T11:00`,
                                        numDays: 1,
                                        roomRentPerDay: room.defaultRent,
                                        extraCharges: 0,
                                        advancePaid: 0,
                                        paymentMode: 'Cash'
                                      });
                                      setActiveTab('billing');
                                      setBillingMode('form');
                                    }
                                  }}
                                  className="w-full py-1 text-[10px] font-bold text-slate-800 bg-white hover:bg-slate-200 rounded border border-slate-300 transition text-center cursor-pointer"
                                >
                                  Force Assign
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}


        {/* --------------------------------------------------------- */}
        {/* TAB 4: ADVANCE BOOKING                                    */}
        {/* (Left: Reservation Form; Right: Reservations Table)      */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'advance' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">

            {/* Left: Advance Booking Form */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>New Advance Booking</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reserve rooms for future arrival dates with advance deposit
                </p>
              </div>

              {advanceSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{advanceSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateAdvanceBooking} className="space-y-3.5">

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guest Full Name *</label>
                  <input
                    type="text"
                    required
                    value={advanceForm.customerName}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, customerName: e.target.value })}
                    placeholder="e.g. Rahul Banerjee"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={advanceForm.customerPhone}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, customerPhone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Check-in Date *</label>
                    <input
                      type="date"
                      required
                      value={advanceForm.checkInDate}
                      onChange={(e) => {
                        const newIn = e.target.value;
                        const d = new Date(newIn + 'T00:00:00');
                        d.setDate(d.getDate() + 1);
                        const nextDay = !isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';
                        const currentOut = advanceForm.checkOutDate;
                        const finalOut = (!currentOut || currentOut <= newIn) ? nextDay : currentOut;
                        setAdvanceForm({ ...advanceForm, checkInDate: newIn, checkOutDate: finalOut });
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Check-out Date *</label>
                    {(() => {
                      const d = new Date((advanceForm.checkInDate || '') + 'T00:00:00');
                      d.setDate(d.getDate() + 1);
                      const minAdvOut = !isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';
                      return (
                        <input
                          type="date"
                          required
                          min={minAdvOut}
                          value={advanceForm.checkOutDate < minAdvOut ? minAdvOut : advanceForm.checkOutDate}
                          onChange={(e) => {
                            const newOut = e.target.value;
                            const finalOut = (newOut <= advanceForm.checkInDate) ? minAdvOut : newOut;
                            setAdvanceForm({ ...advanceForm, checkOutDate: finalOut });
                          }}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        />
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Room Category</label>
                    <select
                      value={advanceForm.roomType}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, roomType: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {hotel.roomTypes?.map((r, i) => (
                        <option key={i} value={r.name}>{r.name} (₹{r.defaultRent})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Allocated Room # (Optional)</label>
                      {advanceForm.roomNumber && (
                        <button
                          type="button"
                          onClick={() => setAdvanceForm({ ...advanceForm, roomNumber: '' })}
                          className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold underline cursor-pointer"
                        >
                          Clear Room
                        </button>
                      )}
                    </div>

                    {advanceForm.roomNumber ? (
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></span>
                          <span className="font-mono font-bold text-xs text-blue-900">Room {advanceForm.roomNumber}</span>
                          <span className="text-[10px] text-blue-600 truncate">({advanceForm.roomType})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAdvRoomSelectorOpen(true)}
                          className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition cursor-pointer flex-shrink-0 ml-1"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAdvRoomSelectorOpen(true)}
                        className="w-full px-2.5 py-2 text-xs text-slate-600 bg-slate-50 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer font-medium"
                      >
                        <BedDouble className="w-3.5 h-3.5" />
                        <span>Click to Select Room (Optional)</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Advance Deposit (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={advanceForm.advancePaid}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, advancePaid: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                    <select
                      value={advanceForm.paymentMode}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, paymentMode: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="UPI / QR">UPI / QR</option>
                      <option value="Cash">Cash</option>
                      <option value="Debit / Credit Card">Debit / Credit Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Special Requests / Notes</label>
                  <textarea
                    rows={2}
                    value={advanceForm.remarks}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, remarks: e.target.value })}
                    placeholder="e.g. Late night check-in, extra bed"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Advance Booking</span>
                </button>

              </form>
            </div>

            {/* Right: Active Reservations Table */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              {(() => {
                const visibleBookings = advanceBookings.filter(adv => adv.status !== 'CHECKED_IN');
                return (
                  <>
                    <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">Upcoming Reservations Directory</h3>
                        <p className="text-xs text-slate-500">Reservations automatically show Yellow on their check-in date</p>
                      </div>
                      <span className="font-mono text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg">
                        {visibleBookings.length} Bookings
                      </span>
                    </div>

                    {visibleBookings.length === 0 ? (
                      <div className="text-center py-16 text-slate-400 text-xs">No upcoming reservations found.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                              <th className="py-2.5 px-3">Booking ID</th>
                              <th className="py-2.5 px-3">Guest</th>
                              <th className="py-2.5 px-3">Arrival Date</th>
                              <th className="py-2.5 px-3">Room</th>
                              <th className="py-2.5 px-3">Deposit</th>
                              <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {visibleBookings.map(adv => {
                              const isCancelled = adv.status === 'CANCELLED';
                              const isToday = adv.checkInDate === getTodayStr();

                              if (isCancelled) {
                                return (
                                  <tr key={adv.bookingId} className="bg-slate-100/90 text-slate-400 select-none transition border-b border-slate-200">
                                    <td className="py-3 px-3 font-mono font-bold text-slate-400">
                                      <span className="line-through">{adv.bookingId}</span>
                                    </td>
                                    <td className="py-3 px-3">
                                      <div className="font-bold text-slate-500 line-through">{adv.customerName}</div>
                                      <div className="text-[11px] text-slate-400 line-through">{adv.customerPhone}</div>
                                      <div className="text-[10px] text-rose-500 font-semibold mt-0.5 no-underline">
                                        {adv.cancellationReason || 'Cancelled by guest'}
                                      </div>
                                    </td>
                                    <td className="py-3 px-3">
                                      <div className="font-semibold text-slate-400 line-through">{adv.checkInDate}</div>
                                    </td>
                                    <td className="py-3 px-3">
                                      <span className="font-mono text-slate-400 line-through">
                                        {adv.roomNumber ? `Room ${adv.roomNumber}` : 'Unassigned'}
                                      </span>
                                      <div className="text-[10px] text-slate-400 line-through">{adv.roomType}</div>
                                    </td>
                                    <td className="py-3 px-3 font-mono text-slate-400 line-through">
                                      ₹{formatINR(adv.advancePaid)}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-200 border border-slate-300 rounded-lg">
                                        <XCircle className="w-3 h-3 text-slate-500" />
                                        <span>CANCELLED</span>
                                      </span>
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <tr key={adv.bookingId} className="hover:bg-slate-50 transition border-b border-slate-100">
                                  <td className="py-3 px-3 font-mono font-bold text-slate-700">{adv.bookingId}</td>
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-slate-900">{adv.customerName}</div>
                                    <div className="text-[11px] text-slate-500">{adv.customerPhone}</div>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="font-semibold text-slate-800">{adv.checkInDate}</div>
                                    {isToday && (
                                      <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 ml-1.5">
                                        ● Arrives Today!
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="font-mono font-bold text-blue-700">
                                      {adv.roomNumber ? `Room ${adv.roomNumber}` : 'Unassigned'}
                                    </span>
                                    <div className="text-[10px] text-slate-500">{adv.roomType}</div>
                                  </td>
                                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">₹{formatINR(adv.advancePaid)}</td>
                                  <td className="py-3 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleCheckInAdvanceGuest(adv)}
                                        className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1"
                                        title="Check-in guest and open billing"
                                      >
                                        <span>Check-in & Bill &rarr;</span>
                                      </button>
                                      <button
                                        onClick={() => handleOpenCancelModal(adv)}
                                        className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1"
                                        title="Cancel reservation or reschedule"
                                      >
                                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Cancel</span>
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
                  </>
                );
              })()}
            </div>

          </div>
        )}


        {/* --------------------------------------------------------- */}
        {/* TAB 5: ROOMS ISSUE (Neutral Grey rooms -> Red on Defect)  */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'issues' && (
          <div className="space-y-6 animate-fade-in">

            {/* Header info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Rooms Issue & Maintenance Registry</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any neutral Grey room to report an issue. Rooms with issues turn <span className="text-rose-600 font-bold">RED</span>. Click red rooms to view or mark Issue Fixed.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Grey: No Issues
                </span>
                <span className="flex items-center gap-1.5 font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Red: Issue Reported!
                </span>
              </div>
            </div>

            {/* Floor by Floor Issue Matrix */}
            <div className="space-y-6">
              {Object.keys(floors).map(floorNum => (
                <div key={floorNum} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg uppercase">
                      Floor {floorNum}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                    {floors[floorNum].map(room => {
                      const hasActiveIssues = room.activeIssues && room.activeIssues.length > 0;

                      // User requirement: Default room color is Grey; turns Red if issue reported!
                      const boxBg = hasActiveIssues
                        ? 'bg-rose-500 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-200/80';

                      return (
                        <button
                          key={room.roomNumber}
                          type="button"
                          onClick={() => setIssueModalRoom(room)}
                          className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer min-h-[110px] ${boxBg}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-mono text-xl font-extrabold">{room.roomNumber}</span>
                            {hasActiveIssues ? (
                              <span className="text-[10px] font-bold bg-white text-rose-700 px-1.5 py-0.5 rounded shadow">
                                ⚠️ ISSUE ({room.activeIssues.length})
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-500">
                                Normal
                              </span>
                            )}
                          </div>

                          <div className="mt-2">
                            <div className={`text-xs font-semibold truncate ${hasActiveIssues ? 'text-white' : 'text-slate-800'}`}>
                              {room.roomType}
                            </div>

                            {hasActiveIssues ? (
                              <div className="text-[11px] font-bold text-rose-100 truncate mt-1">
                                {room.activeIssues[0].issue}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 mt-1">Click to report issue</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 6: FINANCIALS & DAILY SETTLEMENT VIEW                 */}
        {/* (Manager Reconciliation: Collections & Pending Balances) */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'settlement' && (
          <div className="space-y-6 animate-fade-in">

            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Daily Revenue & Settlement Audit
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cash, digital collections, and pending balances for {hotel.name} &bull; {formattedDate}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={loadWorkspaceData}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title="Refresh Settlement Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                  title="Print Daily Settlement Sheet"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Settlement Sheet</span>
                </button>
              </div>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Card 1: Today's Total Collections */}
              <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    Today's Collections
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-mono text-2xl font-extrabold text-emerald-600">
                  ₹{formatINR(finalTotalCollections)}
                </div>
                <div className="text-[11px] text-slate-500">
                  Total actual collections received today
                </div>
              </div>

              {/* Card 2: Cash Collection */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cash in Hand
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-mono text-2xl font-extrabold text-slate-900">
                  ₹{formatINR(finalCash)}
                </div>
                <div className="text-[11px] text-slate-500">
                  {finalTotalCollections > 0 ? Math.round((finalCash / finalTotalCollections) * 100) : 0}% of daily collection
                </div>
              </div>

              {/* Card 3: Digital Collections (UPI + Card) */}
              <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    UPI & Card (Digital)
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-mono text-2xl font-extrabold text-blue-700">
                  ₹{formatINR(finalUPI + finalCard)}
                </div>
                <div className="text-[11px] text-blue-600 font-medium">
                  UPI: ₹{formatINR(finalUPI)} &bull; Card: ₹{formatINR(finalCard)}
                </div>
              </div>

              {/* Card 4: Pending Balances */}
              <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    Pending Balances
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-mono text-2xl font-extrabold text-amber-600">
                  ₹{formatINR(finalPendingTotal)}
                </div>
                <div className="text-[11px] text-amber-700 font-medium">
                  Uncollected across {finalPendingCount} checked-in guests
                </div>
              </div>

            </div>

            {/* Split Sections: 1. Pending Balances Due vs. 2. Payment Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT (8 cols): Uncollected Pending Balances on Active Stays */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-amber-500" />
                      <span>Pending Balances to Collect ({finalPendingList.length} Active Stays)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Guests currently staying who have an uncollected balance due
                    </p>
                  </div>
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                    Total Due: ₹{formatINR(finalPendingTotal)}
                  </span>
                </div>

                {finalPendingList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    All active in-house guest accounts are fully settled! No pending balances.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                          <th className="py-2.5 px-3">Room</th>
                          <th className="py-2.5 px-3">Guest Particulars</th>
                          <th className="py-2.5 px-3">Invoice No</th>
                          <th className="py-2.5 px-3">Stay Total</th>
                          <th className="py-2.5 px-3">Advance Paid</th>
                          <th className="py-2.5 px-3 font-bold text-amber-800">Pending Due</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {finalPendingList.map(item => (
                          <tr key={item.invoiceNo || item.id} className="hover:bg-amber-50/40 transition">
                            <td className="py-3 px-3">
                              <span className="font-mono font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                Room {item.roomNumber}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{item.customerName}</div>
                              <div className="text-[11px] text-slate-500">{item.customerPhone || 'N/A'}</div>
                            </td>
                            <td className="py-3 px-3 font-mono font-medium text-slate-600">
                              {item.invoiceNo}
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                              ₹{formatINR(item.netTotal || item.net)}
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold text-emerald-700">
                              ₹{formatINR(item.advancePaid || item.adv)}
                            </td>
                            <td className="py-3 px-3 font-mono font-extrabold text-amber-600">
                              ₹{formatINR(item.balanceDue)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => {
                                  const targetBill = savedBills.find(b => b.invoiceNo === item.invoiceNo) || item;
                                  setEditingBill(targetBill);
                                  setActiveTab('billing');
                                  setBillingMode('form');
                                }}
                                className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
                              >
                                Settle / Edit &rarr;
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* RIGHT (4 cols): Payment Mode Breakdown Card */}
              <div className="lg:col-span-4 space-y-4">

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Collections Breakdown</h4>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Today's Inflow</span>
                  </div>

                  <div className="space-y-3">
                    {/* Cash */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          <Banknote className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">Cash Collection</div>
                          <div className="text-[10px] text-slate-400">Physical Cash Drawer</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-extrabold text-slate-900 text-sm">₹{formatINR(finalCash)}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          {finalTotalCollections > 0 ? Math.round((finalCash / finalTotalCollections) * 100) : 0}%
                        </div>
                      </div>
                    </div>

                    {/* UPI */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          <QrCode className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">UPI & QR Codes</div>
                          <div className="text-[10px] text-slate-400">PhonePe, GPay, Paytm</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-extrabold text-slate-900 text-sm">₹{formatINR(finalUPI)}</div>
                        <div className="text-[10px] text-blue-600 font-semibold">
                          {finalTotalCollections > 0 ? Math.round((finalUPI / finalTotalCollections) * 100) : 0}%
                        </div>
                      </div>
                    </div>

                    {/* Card */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">Card Swipes / POS</div>
                          <div className="text-[10px] text-slate-400">Debit / Credit Cards</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-extrabold text-slate-900 text-sm">₹{formatINR(finalCard)}</div>
                        <div className="text-[10px] text-purple-600 font-semibold">
                          {finalTotalCollections > 0 ? Math.round((finalCard / finalTotalCollections) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Total Inflow Settled:</span>
                    <span className="font-mono font-extrabold text-slate-900 text-base">₹{formatINR(finalTotalCollections)}</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}


        {/* --------------------------------------------------------- */}
        {/* TAB 7: REPORTS & TAX (GSTR-1 & POLICE STATION COMPLIANCE) */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'reports' && (
          <ReportsAndTax
            hotel={hotel}
            savedBills={savedBills}
            closedBills={closedBills}
          />
        )}
      </main>

      {/* ========================================================= */}
      {/* ROOM ISSUE REPORT & RESOLUTION MODAL                      */}
      {/* ========================================================= */}
      {issueModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${issueModalRoom.activeIssues && issueModalRoom.activeIssues.length > 0
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-slate-100 text-slate-600'
                  }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Room {issueModalRoom.roomNumber} Issue Registry</h4>
                  <p className="text-[11px] text-slate-500">{issueModalRoom.roomType}</p>
                </div>
              </div>
              <button
                onClick={() => setIssueModalRoom(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If room currently has active issues, show them with "Issue Fixed" & "Add More" */}
            {issueModalRoom.activeIssues && issueModalRoom.activeIssues.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                  Active Issues ({issueModalRoom.activeIssues.length}):
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {issueModalRoom.activeIssues.map(issue => (
                    <div key={issue.id} className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-rose-900">{issue.issue}</div>
                        <div className="text-[10px] text-rose-600 mt-1">
                          Reported: {new Date(issue.reportedAt).toLocaleDateString()} {new Date(issue.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {issue.reportedBy || 'Manager'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleFixRoomIssue(issueModalRoom.roomNumber, issue.id)}
                        className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 rounded border border-emerald-300 transition"
                      >
                        ✓ Fixed
                      </button>
                    </div>
                  ))}
                </div>

                {/* Actions: Issue Fixed (All) & Add More Issues */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                  <button
                    onClick={() => handleFixRoomIssue(issueModalRoom.roomNumber, null)}
                    className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    ✓ Mark All Fixed (Return to Grey)
                  </button>
                </div>

                {/* Sub-form to append another issue */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Add Additional Issue:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newIssueText}
                      onChange={(e) => setNewIssueText(e.target.value)}
                      placeholder="e.g. Shower leak, bulb fused..."
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      onClick={handleSaveRoomIssue}
                      disabled={isSavingIssue || !newIssueText.trim()}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition disabled:opacity-50"
                    >
                      Add Issue
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* If room has no issues, show input box to write the issue */
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Report maintenance, plumbing, electrical, or cleaning issues for Room {issueModalRoom.roomNumber}. Once saved, this room turns <span className="font-bold text-rose-600">Red</span> and displays a warning during room assignment.
                </p>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Issue Description *</label>
                  <textarea
                    rows={3}
                    autoFocus
                    value={newIssueText}
                    onChange={(e) => setNewIssueText(e.target.value)}
                    placeholder="e.g. AC remote missing, geyser water heater not turning on, window latch broken..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIssueModalRoom(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRoomIssue}
                    disabled={isSavingIssue || !newIssueText.trim()}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingIssue ? 'Saving...' : 'Save Issue (Turns Room Red)'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CLOSED BILL RECEIPT PREVIEW MODAL                         */}
      {/* ========================================================= */}
      {selectedClosedBillForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-fade-in print:static print:inset-auto print:p-0 print:bg-white print:backdrop-blur-none print:z-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4 relative print:max-w-none print:w-full print:p-0 print:m-0 print:shadow-none print:border-none print:overflow-visible">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 no-print">
              <span className="font-bold text-sm text-slate-800">Closed Bill Receipt Preview</span>
              <button
                onClick={() => setSelectedClosedBillForView(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <InvoicePreview
              hotel={hotel}
              billData={selectedClosedBillForView}
              calculations={{
                roomRentPerDay: selectedClosedBillForView.roomRentPerDay || 0,
                roomsList: selectedClosedBillForView.roomsList || [],
                baseAccommodation: selectedClosedBillForView.baseAccommodation || 0,
                extraCharges: selectedClosedBillForView.extraCharges || 0,
                subtotal: selectedClosedBillForView.subtotal || 0,
                cgst: selectedClosedBillForView.cgst || 0,
                sgst: selectedClosedBillForView.sgst || 0,
                totalGst: selectedClosedBillForView.totalGst || 0,
                netTotal: selectedClosedBillForView.netTotal || 0,
                advancePaid: selectedClosedBillForView.advancePaid || 0,
                balanceDue: 0,
                amountInWords: selectedClosedBillForView.amountInWords || ''
              }}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
              <button
                onClick={() => setSelectedClosedBillForView(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('invoice-card');
                  const safeInv = String(selectedClosedBillForView.invoiceNo || 'INV').replace(/[\/\\?%*:|"<>]/g, '-');
                  const filename = `${hotel.name.replace(/\s+/g, '-')}-Invoice-${safeInv}.pdf`;
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
                  const safeInv = String(selectedClosedBillForView.invoiceNo || 'INV').replace(/[\/\\?%*:|"<>]/g, '-');
                  const filename = `${hotel.name.replace(/\s+/g, '-')}-Invoice-${safeInv}.pdf`;
                  printInvoicePdf(el, filename);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* HELP PAGE / OPERATIONS GUIDE MODAL                         */}
      {/* ========================================================= */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hotel Operations Guide & Help</h3>
                  <p className="text-xs text-slate-500">Standard Operating Procedures for {hotel.name} Manager</p>
                </div>
              </div>

              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
                title="Close Help"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">

              {/* Section 1: Billing Workflow */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>1. Billing & Check-in / Checkout Workflow</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Create New Bill:</span>
                    <p className="leading-relaxed text-[11px]">
                      Go to <strong>Create Bill</strong> &rarr; click <strong>+ Create New Bill</strong>. In <em>Room & Stay Particulars</em>, click <strong>Select Room</strong> to pick from available inventory. Fill in guest name and contact, then save or print.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">In-House Saved Bills:</span>
                    <p className="leading-relaxed text-[11px]">
                      Active guest bills appear on the right side of the Create Bill tab. Click any saved bill to edit particulars, update stay duration, or add extra food charges.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Check Out & 30-Min Housekeeping:</span>
                    <p className="leading-relaxed text-[11px]">
                      When the guest departs, open their active bill and click <strong>Check Out & Print</strong>. The bill status changes to CLOSED and the room enters a <strong>30-minute cleaning countdown</strong>.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Closed Bills Archive:</span>
                    <p className="leading-relaxed text-[11px]">
                      Under Create Bill, click <strong>Closed Bills</strong> to review past checked-out invoices. You can re-print thermal/A4 receipts or send bills to guests via WhatsApp.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Room Status & Color Flags */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <BedDouble className="w-4 h-4 text-emerald-600" />
                  <span>2. Room Status & Live Color Flags</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span>Green</span>
                    </div>
                    <div className="font-semibold text-[11px]">Available</div>
                    <p className="text-[10px] text-emerald-800 mt-1">Cleaned, inspected, ready for guest check-in.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950">
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span>Red</span>
                    </div>
                    <div className="font-semibold text-[11px]">Occupied</div>
                    <p className="text-[10px] text-rose-800 mt-1">Guest currently checked in. Click to view stay details.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span>Yellow</span>
                    </div>
                    <div className="font-semibold text-[11px]">Reserved</div>
                    <p className="text-[10px] text-amber-800 mt-1">Advance reservation arriving today. Click to check in.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-200/70 border border-slate-300 text-slate-800">
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                      <span>Grey</span>
                    </div>
                    <div className="font-semibold text-[11px]">Housekeeping</div>
                    <p className="text-[10px] text-slate-600 mt-1">Under 30-min cleaning cycle. Force-assignable with warning.</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Advance Bookings & Rooms Issue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>3. Advance Booking</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Record upcoming reservations with advance deposit. The system automatically highlights the room <strong>Yellow</strong> on check-in day while keeping it <strong>Green</strong> on earlier vacant dates.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>4. Rooms Issue Tracker</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Click neutral grey rooms to report maintenance issues (AC, plumbing, electrical). The room turns <strong>RED</strong> with an alert badge that warns managers if selected during billing. Click <strong>Mark All Fixed</strong> when resolved.
                  </p>
                </div>
              </div>

              {/* Section 4: Support & Contacts */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Need Technical Support?</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Central Admin: Kaushik &bull; Phone: <span className="font-mono font-bold text-blue-700">7477310465</span>
                  </p>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Version: <span className="font-bold text-slate-700">v2.0 MERN Cloud Suite</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm cursor-pointer"
              >
                Close Guide
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Advance Booking Room Selector Modal */}
      {isAdvRoomSelectorOpen && (
        <RoomSelectorModal
          isOpen={isAdvRoomSelectorOpen}
          onClose={() => setIsAdvRoomSelectorOpen(false)}
          hotelId={hotel.hotelId}
          selectedRoomNumber={advanceForm.roomNumber}
          isOptional={true}
          isAdvance={true}
          targetDate={advanceForm.checkInDate}
          onSelectRooms={(selected) => {
            if (selected && selected.length > 0) {
              const primary = selected[0];
              setAdvanceForm(prev => ({
                ...prev,
                roomNumber: primary.roomNumber,
                roomType: primary.roomType || prev.roomType
              }));
            } else {
              setAdvanceForm(prev => ({
                ...prev,
                roomNumber: ''
              }));
            }
            setIsAdvRoomSelectorOpen(false);
          }}
        />
      )}

      {/* Reservation Cancellation & Reschedule Modal */}
      {selectedBookingForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <CalendarX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Reservation Action: Cancel / Reschedule</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedBookingForCancel.bookingId} &bull; {selectedBookingForCancel.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForCancel(null)}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

              {/* Summary Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Arrival Date</span>
                  <span className="font-semibold text-slate-700">{selectedBookingForCancel.checkInDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Allocated Room</span>
                  <span className="font-mono font-bold text-blue-700">
                    {selectedBookingForCancel.roomNumber ? `Room ${selectedBookingForCancel.roomNumber}` : 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Advance Paid</span>
                  <span className="font-bold text-emerald-700 font-mono">₹{formatINR(selectedBookingForCancel.advancePaid)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contact</span>
                  <span className="text-slate-700">{selectedBookingForCancel.customerPhone}</span>
                </div>
              </div>

              {/* Choose Action Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Action Option:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCancelForm(prev => ({ ...prev, type: 'DATE_CHANGE' }))}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      cancelForm.type === 'DATE_CHANGE'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Date Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelForm(prev => ({ ...prev, type: 'REFUND' }))}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      cancelForm.type === 'REFUND'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Refund Advance
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelForm(prev => ({ ...prev, type: 'OTHER' }))}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                      cancelForm.type === 'OTHER'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Others
                  </button>
                </div>
              </div>

              {/* Option 1: Date Change */}
              {cancelForm.type === 'DATE_CHANGE' && (
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Reschedule Arrival & Departure Dates</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">New Check-in Date *</label>
                      <input
                        type="date"
                        min={getTodayStr()}
                        value={cancelForm.newCheckInDate}
                        onChange={(e) => {
                          const newIn = e.target.value;
                          const d = new Date(newIn + 'T00:00:00');
                          d.setDate(d.getDate() + 1);
                          const nextDay = getTodayStr(d);
                          const finalOut = (!cancelForm.newCheckOutDate || cancelForm.newCheckOutDate <= newIn) ? nextDay : cancelForm.newCheckOutDate;
                          setCancelForm(prev => ({ ...prev, newCheckInDate: newIn, newCheckOutDate: finalOut }));
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">New Check-out Date *</label>
                      <input
                        type="date"
                        min={cancelForm.newCheckInDate || getTodayStr()}
                        value={cancelForm.newCheckOutDate}
                        onChange={(e) => setCancelForm(prev => ({ ...prev, newCheckOutDate: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Notes / Reason for Date Change</label>
                    <input
                      type="text"
                      value={cancelForm.reason}
                      onChange={(e) => setCancelForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g. Guest postponed trip"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Option 2: Refund Advance */}
              {cancelForm.type === 'REFUND' && (
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Refund Advance Deposit & Cancel Reservation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Refund Amount (₹)</label>
                      <input
                        type="number"
                        min={0}
                        max={selectedBookingForCancel.advancePaid}
                        value={cancelForm.refundAmount}
                        onChange={(e) => setCancelForm(prev => ({ ...prev, refundAmount: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Refund Method</label>
                      <select
                        value={cancelForm.refundMethod}
                        onChange={(e) => setCancelForm(prev => ({ ...prev, refundMethod: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                      >
                        <option value="UPI / QR">UPI / QR</option>
                        <option value="Cash">Cash</option>
                        <option value="Debit / Credit Card">Debit / Credit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Refund Remarks / Reason</label>
                    <input
                      type="text"
                      value={cancelForm.reason}
                      onChange={(e) => setCancelForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g. Cancelled 48h prior, full refund issued"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-emerald-700 italic">
                    The reservation will be grayed out with CANCELLED status and any allocated room immediately freed up.
                  </p>
                </div>
              )}

              {/* Option 3: Others */}
              {cancelForm.type === 'OTHER' && (
                <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-3">
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cancellation with Custom Reason</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Cancellation Reason * (Input Box)</label>
                    <textarea
                      rows={3}
                      required
                      value={cancelForm.reason}
                      onChange={(e) => setCancelForm(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g. Guest no-show, booking cancelled per guest phone call, duplicate booking"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <p className="text-[11px] text-rose-700 italic">
                    The bill details will be fully grayed out with CANCELLED text.
                  </p>
                </div>
              )}

            </div>

            {/* Modal Footer: Skipped and Saved options */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedBookingForCancel(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl transition cursor-pointer hover:bg-slate-100"
              >
                Skip / Keep Active
              </button>
              <button
                type="button"
                disabled={cancelForm.isSaving || (cancelForm.type === 'OTHER' && !cancelForm.reason.trim())}
                onClick={handleConfirmCancel}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelForm.isSaving ? 'Saving...' : 'Save & Confirm'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 text-center text-[11px] text-slate-400 py-3">
        {hotel.name} Operations Hub &bull; Floor-by-Floor Live Status &bull; Powered by MongoDB Atlas Cloud
      </footer>

    </div>
  );
}
