import React, { useState, useEffect } from 'react';
import InvoicePreview from './InvoicePreview';
import RoomSelectorModal from './RoomSelectorModal';
import { numberToWordsINR, formatINR } from '../utils/numberToWords';
import { downloadInvoicePdf, printInvoicePdf } from '../utils/pdfExport';
import {
  Building2, Printer, Download, Share2, Save, History,
  RotateCcw, BedDouble, User, Calendar,
  CreditCard, CheckCircle2, ChevronRight, Phone, AlertTriangle, ArrowLeft,
  Settings, LogOut, Eye, EyeOff, FileText, Stamp
} from 'lucide-react';

export default function BillingEngine({ 
  hotel, 
  token, 
  onLogout, 
  onOpenHistory, 
  initialBillData, 
  onSaveSuccess, 
  onCheckoutSuccess, 
  onCloseBilling 
}) {
  // Current date initialization
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedBillDate = `${String(now.getDate()).padStart(2, '0')}-${months[now.getMonth()]}-${now.getFullYear()}`;

  const yy = String(now.getFullYear()).slice(-2);
  const initialPrefix = hotel?.hotelId === 'hotel-1' ? 'HR' : hotel?.hotelId === 'hotel-2' ? 'HS' : 'HSP2';
  const defaultInitialInvoiceNo = `${initialPrefix}/${yy}/00001`;

  // Form State
  const [billData, setBillData] = useState(() => {
    if (initialBillData) {
      const b = { ...initialBillData };
      if (!b.checkInDate && b.checkInDateTime) {
        b.checkInDate = b.checkInDateTime.slice(0, 10);
      }
      if (!b.checkOutDate && b.checkOutDateTime) {
        b.checkOutDate = b.checkOutDateTime.slice(0, 10);
      }
      return b;
    }
    return {
      invoiceNo: defaultInitialInvoiceNo,
      billDate: formattedBillDate,
      customerName: '',
      countryCode: '+91',
      customerPhone: '',
      idType: 'Aadhaar Card',
      idNumber: '',
      roomType: hotel.roomTypes?.[0]?.name || 'Standard Room',
      roomNumber: '',
      selectedRooms: [],
      numPersons: 2,
      checkInDate: todayStr,
      checkOutDate: tomorrowStr,
      checkInDateTime: `${todayStr}T12:00`,
      checkOutDateTime: `${tomorrowStr}T11:00`,
      numDays: 1,
      roomRentPerDay: hotel.roomTypes?.[0]?.defaultRent || 1500,
      extraCharges: 0,
      advancePaid: 0,
      paymentMode: 'Cash',
      remarks: 'Thank you for choosing to stay with us. Visit again!',
      showManagerSign: true
    };
  });

  const [isRoomSelectorOpen, setIsRoomSelectorOpen] = useState(false);
  const [selectedRoomWarning, setSelectedRoomWarning] = useState('');

  // Bill Settings (controls invoice display options)
  // Per requirement: Saved bills ALWAYS open in GST layout with Meta Data OFF.
  // Manager must explicitly toggle Meta Data ON and enter PIN to switch back to simplified layout.
  const [billSettings, setBillSettings] = useState(() => ({
    showManagerSign: true,
    showGST: true,
    showTerms: true,
    showRemarks: true,
    isNonGST: false,
  }));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Non-GST PIN unlock modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // Helper to sanitize ID number per document type
  const sanitizeIdNumber = (type, val) => {
    if (!val) return '';
    if (type === 'Aadhaar Card') {
      return val.replace(/\D/g, '').slice(0, 12);
    }
    if (type === 'Voter ID' || type === 'PAN Card') {
      return val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
    }
    if (type === 'Passport' || type === 'Driving License') {
      return val.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15).toUpperCase();
    }
    return val.slice(0, 15);
  };

  // Fetch next sequential invoice number from database (supporting separate Non-GST vs GST sequence)
  const fetchNextInvoiceNumber = async (forNonGST = false) => {
    if (!hotel?.hotelId) return;
    try {
      const res = await fetch(`/api/bills/next-invoice-no?hotelId=${hotel.hotelId}&hotelName=${encodeURIComponent(hotel.name || '')}&isNonGST=${forNonGST}`);
      const data = await res.json();
      if (data.success && data.nextInvoiceNo) {
        setBillData(prev => ({
          ...prev,
          invoiceNo: data.nextInvoiceNo
        }));
      }
    } catch (err) {
      console.error('Failed to fetch next sequential invoice number:', err);
    }
  };

  // Handle Non-GST toggle — requires PIN verification to enable
  const handleNonGSTToggle = () => {
    if (billSettings.isNonGST) {
      // Turning OFF: no PIN needed -> switch back to GST sequence if fresh unsaved bill
      setBillSettings(s => ({ ...s, isNonGST: false, showGST: true }));
      if (!billData._id && !billData.id) {
        fetchNextInvoiceNumber(false);
      }
    } else {
      // Turning ON: ask for manager PIN
      setPinInput('');
      setPinError('');
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = async () => {
    if (!pinInput.trim()) { setPinError('Please enter PIN.'); return; }
    setPinLoading(true);
    setPinError('');
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: hotel.hotelId, pin: pinInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setBillSettings(s => ({ ...s, isNonGST: true, showGST: false }));
        setShowPinModal(false);
        setPinInput('');
        // If creating a fresh bill, switch to the separate non-GST sequence (starts at 10001)
        if (!billData._id && !billData.id) {
          fetchNextInvoiceNumber(true);
        }
      } else {
        setPinError(data.message || 'Incorrect PIN.');
      }
    } catch (e) {
      setPinError('Server error. Try again.');
    } finally {
      setPinLoading(false);
    }
  };
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [autoCalcDays, setAutoCalcDays] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mobileTab, setMobileTab] = useState('form'); // 'form' or 'preview'
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    if (!initialBillData && hotel?.hotelId) {
      fetchNextInvoiceNumber(false);
    }
  }, [hotel?.hotelId, initialBillData]);

  // Update when initialBillData changes
  // Per requirement: Saved bill ALWAYS opens with Meta Data OFF (GST layout visible).
  // Manager must enter PIN to switch back to Meta Data layout.
  useEffect(() => {
    if (initialBillData) {
      const b = { ...initialBillData };
      if (!b.checkInDate && b.checkInDateTime) {
        b.checkInDate = b.checkInDateTime.slice(0, 10);
      }
      if (!b.checkOutDate && b.checkOutDateTime) {
        b.checkOutDate = b.checkOutDateTime.slice(0, 10);
      }
      setBillData(b);
      setBillSettings(s => ({ ...s, isNonGST: false, showGST: true }));
    }
  }, [initialBillData]);

  // Handle Multiple Rooms Selected from Modal
  const handleRoomsSelected = (rooms) => {
    if (!rooms || rooms.length === 0) return;

    const roomNumbers = rooms.map(r => r.roomNumber).join(', ');
    const roomTypes = [...new Set(rooms.map(r => r.roomType))].join(', ');

    setBillData(prev => {
      const updatedSelectedRooms = rooms.map(r => {
        const existing = prev.selectedRooms?.find(er => er.roomNumber === r.roomNumber);
        const rent = existing && existing.rentPerDay !== undefined
          ? existing.rentPerDay
          : (parseFloat(r.defaultRent || r.rentPerDay) || 2000);
        return {
          roomNumber: r.roomNumber,
          roomType: r.roomType || 'Standard Room',
          rentPerDay: rent
        };
      });

      const totalRentPerDay = updatedSelectedRooms.reduce((sum, r) => sum + (parseFloat(r.rentPerDay) || 0), 0);

      return {
        ...prev,
        roomNumber: roomNumbers,
        roomType: roomTypes,
        selectedRooms: updatedSelectedRooms,
        roomRentPerDay: totalRentPerDay
      };
    });

    // Warning check
    const issueRoom = rooms.find(r => r.activeIssues && r.activeIssues.length > 0);
    if (issueRoom) {
      setSelectedRoomWarning(`Room ${issueRoom.roomNumber}: ${issueRoom.activeIssues[0].issue}`);
    } else {
      setSelectedRoomWarning('');
    }
  };

  // Change individual room rate when multiple rooms are booked
  const handleSpecificRoomRateChange = (roomNumber, val) => {
    const newRate = val === '' ? '' : Math.max(0, parseFloat(val) || 0);

    setBillData(prev => {
      const updated = (prev.selectedRooms || []).map(r => {
        if (r.roomNumber === roomNumber) {
          return { ...r, rentPerDay: newRate };
        }
        return r;
      });

      const totalRent = updated.reduce((sum, r) => sum + (parseFloat(r.rentPerDay) || 0), 0);

      return {
        ...prev,
        selectedRooms: updated,
        roomRentPerDay: totalRent
      };
    });
  };

  // Change single room rate
  const handleSingleRoomRateChange = (newRate) => {
    const rate = newRate === '' ? '' : Math.max(0, parseFloat(newRate) || 0);
    const updatedRooms = (billData.selectedRooms || []).map(r => ({ ...r, rentPerDay: rate }));
    setBillData(prev => ({
      ...prev,
      roomRentPerDay: rate,
      selectedRooms: updatedRooms.length > 0 ? updatedRooms : [{ roomNumber: prev.roomNumber, roomType: prev.roomType, rentPerDay: rate }]
    }));
  };

  // Helper to compute next day (YYYY-MM-DD)
  const getNextDayDateString = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Handle Check-in Date Change with automatic restriction on Check-out Date
  const handleCheckInDateChange = (newInDate) => {
    if (!newInDate) return;
    setAutoCalcDays(true);

    const minAllowedOutDate = getNextDayDateString(newInDate);
    const currentOutDate = billData.checkOutDate || (billData.checkOutDateTime ? billData.checkOutDateTime.slice(0, 10) : '');

    // If current check-out date is missing or on/before the new check-in date, auto advance to the next day
    const mustBumpOutDate = !currentOutDate || currentOutDate <= newInDate;
    const finalOutDate = mustBumpOutDate ? minAllowedOutDate : currentOutDate;

    setBillData(prev => ({
      ...prev,
      checkInDate: newInDate,
      checkInDateTime: `${newInDate}T12:00`,
      checkOutDate: finalOutDate,
      checkOutDateTime: `${finalOutDate}T11:00`
    }));
  };

  // Handle Check-out Date Change with strict validation
  const handleCheckOutDateChange = (newOutDate) => {
    if (!newOutDate) return;
    setAutoCalcDays(true);

    const activeInDate = billData.checkInDate || (billData.checkInDateTime ? billData.checkInDateTime.slice(0, 10) : todayStr);
    const minAllowedOutDate = getNextDayDateString(activeInDate);

    // If selected checkout date is on or before checkin date, enforce minimum allowed checkout date
    const finalOutDate = (newOutDate <= activeInDate) ? minAllowedOutDate : newOutDate;

    setBillData(prev => ({
      ...prev,
      checkOutDate: finalOutDate,
      checkOutDateTime: `${finalOutDate}T11:00`
    }));
  };

  // Auto calculate days between checkin date and checkout date (PURE DATE CALCULATION)
  useEffect(() => {
    const inDateStr = billData.checkInDate || (billData.checkInDateTime ? billData.checkInDateTime.slice(0, 10) : '');
    const outDateStr = billData.checkOutDate || (billData.checkOutDateTime ? billData.checkOutDateTime.slice(0, 10) : '');
    if (!inDateStr || !outDateStr) return;

    const d1 = new Date(inDateStr + 'T00:00:00');
    const d2 = new Date(outDateStr + 'T00:00:00');
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return;

    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    const calcDays = Math.max(1, diffDays);

    if (autoCalcDays && calcDays !== billData.numDays) {
      setBillData(prev => ({ ...prev, numDays: calcDays }));
    }
  }, [billData.checkInDate, billData.checkOutDate, billData.checkInDateTime, billData.checkOutDateTime, autoCalcDays]);

  // Handle Room Type Change (single room manual override)
  const handleRoomTypeChange = (e) => {
    const selectedName = e.target.value;
    const foundRoom = hotel.roomTypes?.find(r => r.name === selectedName);
    const newRent = foundRoom ? foundRoom.defaultRent : billData.roomRentPerDay;
    setBillData(prev => ({
      ...prev,
      roomType: selectedName,
      roomRentPerDay: newRent,
      selectedRooms: prev.selectedRooms?.length > 0
        ? prev.selectedRooms.map(r => ({ ...r, roomType: selectedName, rentPerDay: newRent }))
        : prev.selectedRooms
    }));
  };

  // Perform Calculations (Supporting multiple itemized rooms)
  const days = Math.max(1, parseInt(billData.numDays) || 1);
  const extra = Math.max(0, parseFloat(billData.extraCharges) || 0);
  const advance = Math.max(0, parseFloat(billData.advancePaid) || 0);

  // If multiple rooms are selected, itemize each room
  const activeRoomsList = (billData.selectedRooms && billData.selectedRooms.length > 0)
    ? billData.selectedRooms
    : [{ 
        roomNumber: billData.roomNumber || '302', 
        roomType: billData.roomType || 'Deluxe Room', 
        rentPerDay: Math.max(0, parseFloat(billData.roomRentPerDay) || 0) 
      }];

  const itemizedRooms = activeRoomsList.map(r => ({
    roomNumber: r.roomNumber,
    roomType: r.roomType,
    rentPerDay: parseFloat(r.rentPerDay) || 0,
    days,
    total: (parseFloat(r.rentPerDay) || 0) * days
  }));

  const baseAccommodation = itemizedRooms.reduce((sum, r) => sum + r.total, 0);
  const totalDailyRent = itemizedRooms.reduce((sum, r) => sum + r.rentPerDay, 0);
  const subtotal = baseAccommodation + extra;

  // When Non-GST mode is active, zero out all GST
  const isNonGST = billSettings.isNonGST;
  const cgst = isNonGST ? 0 : Math.round((subtotal * 0.025) * 100) / 100;
  const sgst = isNonGST ? 0 : Math.round((subtotal * 0.025) * 100) / 100;
  const totalGst = isNonGST ? 0 : Math.round((cgst + sgst) * 100) / 100;

  const netTotal = Math.round((subtotal + totalGst) * 100) / 100;
  const balanceDue = Math.round((netTotal - advance) * 100) / 100;
  const amountInWords = numberToWordsINR(balanceDue > 0 ? balanceDue : netTotal);

  const calculations = {
    roomRentPerDay: totalDailyRent,
    roomsList: itemizedRooms,
    baseAccommodation,
    extraCharges: extra,
    subtotal,
    cgst,
    sgst,
    totalGst,
    netTotal,
    advancePaid: advance,
    balanceDue,
    amountInWords
  };

  // Save / Update Bill to Backend MongoDB
  const handleSaveBill = async () => {
    if (!billData.customerName) {
      alert('Please enter guest name.');
      return;
    }
    if (!billData.roomNumber) {
      alert('Please select at least one room for this bill.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      const inDate = billData.checkInDate || (billData.checkInDateTime ? billData.checkInDateTime.slice(0, 10) : todayStr);
      const outDate = billData.checkOutDate || (billData.checkOutDateTime ? billData.checkOutDateTime.slice(0, 10) : tomorrowStr);

      const payload = {
        ...billData,
        ...calculations,
        checkInDate: inDate,
        checkOutDate: outDate,
        checkInDateTime: `${inDate}T12:00`,
        checkOutDateTime: `${outDate}T11:00`,
        selectedRooms: billData.selectedRooms || [],
        roomsList: itemizedRooms,
        hotelId: hotel.hotelId,
        hotelName: hotel.name,
        paymentStatus: balanceDue <= 0 ? 'PAID' : 'DUE',
        billStatus: billData.billStatus || 'SAVED',
        isNonGST: billSettings.isNonGST || false
      };

      const billId = billData._id || billData.id;
      const url = billId ? `/api/bills/${billId}` : '/api/bills';
      const method = billId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg(`Bill ${data.bill.invoiceNo} saved successfully to database!`);
        setBillData(data.bill);
        if (onSaveSuccess) onSaveSuccess(data.bill);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        alert(data.message || 'Failed to save bill.');
      }
    } catch (err) {
      alert('Error saving bill to server.');
    } finally {
      setIsSaving(false);
    }
  };

  // Checkout and Print
  const handleCheckoutAndPrint = async () => {
    const billId = billData._id || billData.id;
    if (!billId) {
      alert('Please click "Save Bill" first to record this stay before checking out.');
      return;
    }

    if (!window.confirm(`Check out guest ${billData.customerName} from Room(s) ${billData.roomNumber}? This will mark invoice as CLOSED and place the room(s) in 30-minute housekeeping.`)) {
      return;
    }

    setIsCheckingOut(true);
    try {
      const res = await fetch(`/api/bills/${billId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg(data.message);
        setBillData(data.bill);
        window.print();
        if (onCheckoutSuccess) onCheckoutSuccess(data.bill);
      } else {
        alert(data.message || 'Checkout failed.');
      }
    } catch (err) {
      alert('Server error during checkout.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // WhatsApp Share
  const handleWhatsAppShare = () => {
    const cleanPhone = billData.customerPhone.replace(/\D/g, '');
    if (!cleanPhone) {
      alert('Please enter a valid guest phone number.');
      return;
    }

    const country = billData.countryCode.replace('+', '');
    const fullPhone = cleanPhone.startsWith(country) ? cleanPhone : country + cleanPhone;

    const message =
      `🏨 *${hotel.name.toUpperCase()} - TAX INVOICE*
*${hotel.subText}*
📍 ${hotel.address}
📞 Mobile: ${hotel.phone} | GSTIN: ${hotel.gstin}
━━━━━━━━━━━━━━━━━━━━━
📄 *Invoice No:* ${billData.invoiceNo}
📅 *Date:* ${billData.billDate}
👤 *Guest Name:* ${billData.customerName}
🛏️ *Room(s):* ${billData.roomNumber} (${billData.roomType})
⏳ *Duration:* ${billData.numDays} Day(s)
━━━━━━━━━━━━━━━━━━━━━
💰 *Net Total Bill:* ₹ ${formatINR(netTotal)}
💳 *Advance Paid:* ₹ ${formatINR(advance)}
🏷️ *Balance Due:* ₹ ${formatINR(balanceDue)}
━━━━━━━━━━━━━━━━━━━━━
🙏 *Thank you for staying at ${hotel.name}!* Have a safe and pleasant journey!`;

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Download PDF (with masked ID for customer copy privacy, exact A4 single-page format)
  const handleDownloadPDF = () => {
    const el = document.getElementById('invoice-card');
    const safeInv = String(billData.invoiceNo).replace(/\//g, '-');
    const filename = `${hotel.name.replace(/\s+/g, '-')}-Invoice-${safeInv}.pdf`;
    downloadInvoicePdf(el, filename);
  };

  // Reset Form for Fresh Guest Check-in
  const handleReset = async () => {
    if (window.confirm('Start new invoice? Current unsaved entries will be reset.')) {
      let nextInv = '';
      try {
        const res = await fetch(`/api/bills/next-invoice-no?hotelId=${hotel.hotelId}&hotelName=${encodeURIComponent(hotel.name || '')}`);
        const data = await res.json();
        if (data.success && data.nextInvoiceNo) nextInv = data.nextInvoiceNo;
      } catch (e) {}

      const fallbackInv = `${initialPrefix}/${yy}/00001`;

      setBillData({
        invoiceNo: nextInv || fallbackInv,
        billDate: formattedBillDate,
        customerName: '',
        countryCode: '+91',
        customerPhone: '',
        idType: 'Aadhaar Card',
        idNumber: '',
        roomType: hotel.roomTypes?.[0]?.name || 'Standard Room',
        roomNumber: '',
        selectedRooms: [],
        numPersons: 2,
        checkInDate: todayStr,
        checkOutDate: tomorrowStr,
        checkInDateTime: `${todayStr}T12:00`,
        checkOutDateTime: `${tomorrowStr}T11:00`,
        numDays: 1,
        roomRentPerDay: hotel.roomTypes?.[0]?.defaultRent || 1500,
        extraCharges: 0,
        advancePaid: 0,
        paymentMode: 'Cash',
        remarks: 'Thank you for choosing to stay with us. Visit again!',
        showManagerSign: true
      });
      setSelectedRoomWarning('');
    }
  };

  // Sample Data Fill
  const handleSampleFill = () => {
    setBillData(prev => ({
      ...prev,
      customerName: 'Sourav Ganguly',
      countryCode: '+91',
      customerPhone: '9831098765',
      idType: 'Aadhaar Card',
      idNumber: '4521 8974 6502',
      roomNumber: '302, 304',
      roomType: 'Super Deluxe Room, Deluxe Room',
      selectedRooms: [
        { roomNumber: '302', roomType: 'Super Deluxe Room', rentPerDay: 3000 },
        { roomNumber: '304', roomType: 'Deluxe Room', rentPerDay: 2500 }
      ],
      numPersons: 5,
      checkInDate: todayStr,
      checkOutDate: tomorrowStr,
      checkInDateTime: `${todayStr}T12:00`,
      checkOutDateTime: `${tomorrowStr}T11:00`,
      numDays: 2,
      roomRentPerDay: 5500,
      extraCharges: 600,
      advancePaid: 2000,
      paymentMode: 'UPI / QR',
      remarks: 'Late checkout approved till 1:00 PM. Complimentary breakfast included.'
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between print:min-h-0 print:bg-white print:block">

      {/* Top Navbar */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Active Hotel Brand */}
          <div className="flex items-center space-x-3">
            {onCloseBilling && (
              <button
                type="button"
                onClick={onCloseBilling}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1 mr-1 cursor-pointer"
                title="Return to Manager Operations Hub"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Hub</span>
              </button>
            )}
            <div
              style={{ backgroundColor: hotel.themeColor || '#1a365d' }}
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-serif font-bold text-xl shadow-sm flex-shrink-0"
            >
              {hotel.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {hotel.name}
                </h1>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Manager POS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                {hotel.subText} &bull; {hotel.phone}
              </p>
            </div>
          </div>

          {/* Top Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="Clear form for a new guest"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>

            <button
              type="button"
              onClick={handleSaveBill}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Save bill record to database"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Bill'}</span>
            </button>

            {(billData._id || billData.id) && billData.billStatus !== 'CLOSED' && (
              <button
                type="button"
                onClick={handleCheckoutAndPrint}
                disabled={isCheckingOut}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Check out guest, close bill, and enter 30-min housekeeping cycle"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isCheckingOut ? 'Checking Out...' : 'Check Out & Print'}</span>
              </button>
            )}

            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition flex items-center gap-1 cursor-pointer"
                title="View bill records history"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Records</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 text-xs font-bold text-white bg-brand-800 hover:bg-brand-900 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('invoice-card');
                const safeInv = String(billData.invoiceNo || 'INV').replace(/[\/\\?%*:|"<>]/g, '-');
                const filename = `${hotel.name.replace(/\s+/g, '-')}-Invoice-${safeInv}.pdf`;
                printInvoicePdf(el, filename);
              }}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* ⚙️ Bill Settings Gear */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(prev => !prev)}
                className={`p-2 rounded-lg border transition cursor-pointer ${
                  isSettingsOpen
                    ? 'bg-slate-700 text-white border-slate-700 shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-300'
                }`}
                title="Bill Settings"
              >
                <Settings className={`w-4 h-4 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90' : ''}`} />
              </button>

              {/* Settings Dropdown Panel */}
              {isSettingsOpen && (
                <>
                  {/* Backdrop to close on outside click */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSettingsOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    {/* Panel Header */}
                    <div className="px-4 py-3 bg-slate-800 text-white flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-bold tracking-wide">Bill Display Settings</span>
                    </div>

                    <div className="p-3 space-y-1">

                      {/* Toggle: Manager Sign & Stamp */}
                      <label className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Stamp className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-800">Manager Sign &amp; Stamp</div>
                            <div className="text-[10px] text-slate-500">Show signature on printed invoice</div>
                          </div>
                        </div>
                        <div
                          onClick={() => setBillSettings(s => ({ ...s, showManagerSign: !s.showManagerSign }))}
                          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                            billSettings.showManagerSign ? 'bg-blue-500' : 'bg-slate-300'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                            billSettings.showManagerSign ? 'left-5' : 'left-0.5'
                          }`} />
                        </div>
                      </label>

                      {/* Toggle: GST Breakdown */}
                      <label className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-800">GST Breakdown</div>
                            <div className="text-[10px] text-slate-500">Show CGST / SGST rows on bill</div>
                          </div>
                        </div>
                        <div
                          onClick={() => setBillSettings(s => ({ ...s, showGST: !s.showGST }))}
                          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                            billSettings.showGST ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                            billSettings.showGST ? 'left-5' : 'left-0.5'
                          }`} />
                        </div>
                      </label>

                      {/* Toggle: Terms & Conditions */}
                      <label className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-800">Terms &amp; Conditions</div>
                            <div className="text-[10px] text-slate-500">Show T&amp;C section on bill</div>
                          </div>
                        </div>
                        <div
                          onClick={() => setBillSettings(s => ({ ...s, showTerms: !s.showTerms }))}
                          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                            billSettings.showTerms ? 'bg-purple-500' : 'bg-slate-300'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                            billSettings.showTerms ? 'left-5' : 'left-0.5'
                          }`} />
                        </div>
                      </label>

                      {/* Toggle: Remarks */}
                      <label className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-800">Remarks</div>
                            <div className="text-[10px] text-slate-500">Show remarks/notes on bill</div>
                          </div>
                        </div>
                        <div
                          onClick={() => setBillSettings(s => ({ ...s, showRemarks: !s.showRemarks }))}
                          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                            billSettings.showRemarks ? 'bg-amber-500' : 'bg-slate-300'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                            billSettings.showRemarks ? 'left-5' : 'left-0.5'
                          }`} />
                        </div>
                      </label>

                      {/* Divider */}
                      <div className="my-1 border-t border-dashed border-slate-200" />

                      {/* Toggle: Meta Data Layout (PIN PROTECTED) */}
                      <label className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition ${
                        billSettings.isNonGST ? 'bg-red-50 border border-red-200' : 'hover:bg-slate-50'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            billSettings.isNonGST ? 'bg-red-100' : 'bg-slate-100'
                          }`}>
                            <Settings className={`w-3.5 h-3.5 ${billSettings.isNonGST ? 'text-red-600' : 'text-slate-500'}`} />
                          </div>
                          <div>
                            <div className={`text-xs font-bold ${
                              billSettings.isNonGST ? 'text-red-700' : 'text-slate-800'
                            }`}>
                              Meta Data
                              {!billSettings.isNonGST && <span className="ml-1 text-[9px] text-slate-400 font-normal">🔒 PIN required</span>}
                              {billSettings.isNonGST && <span className="ml-1 text-[9px] text-red-500 font-semibold">ACTIVE</span>}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {billSettings.isNonGST
                                ? 'Internal simplified bill layout active'
                                : 'Switch to simplified bill layout'}
                            </div>
                          </div>
                        </div>
                        <div
                          onClick={handleNonGSTToggle}
                          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                            billSettings.isNonGST ? 'bg-red-500' : 'bg-slate-300'
                          }`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                            billSettings.isNonGST ? 'left-5' : 'left-0.5'
                          }`} />
                        </div>
                      </label>

                    </div>

                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                      Settings apply to screen preview &amp; printed output
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* PIN VERIFICATION MODAL (for Meta Data unlock)                */}
      {/* ============================================================ */}
      {showPinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Meta Data Mode — PIN Required</div>
                  <div className="text-xs text-slate-200 mt-0.5">Enter manager PIN to unlock</div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium">
                🔒 Switching to confidential simplified bill layout mode.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Manager PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pinInput}
                  onChange={e => { setPinInput(e.target.value); setPinError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
                  placeholder="Enter PIN"
                  className="w-full px-4 py-3 text-center text-xl font-mono font-bold tracking-[0.4em] bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  autoFocus
                />
                {pinError && (
                  <div className="mt-2 text-xs text-red-600 font-semibold text-center">{pinError}</div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowPinModal(false); setPinInput(''); setPinError(''); }}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePinSubmit}
                  disabled={pinLoading}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-slate-800 hover:bg-black rounded-xl transition shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {pinLoading ? 'Verifying...' : 'Unlock Meta Data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="no-print lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-center gap-2 sticky top-16 z-30">
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
            mobileTab === 'form' ? 'bg-brand-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Guest & Room Form
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
            mobileTab === 'preview' ? 'bg-brand-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
          }`}
        >
          Invoice Receipt Preview
        </button>
      </div>

      {/* Success Notification Bar */}
      {saveSuccessMsg && (
        <div className="no-print bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Form & Preview Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 print:max-w-none print:w-full print:p-0 print:m-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block print:w-full">

          {/* ======================================= */}
          {/* LEFT: GUEST PARTICULARS & TARIFF FORM   */}
          {/* ======================================= */}
          <section className={`lg:col-span-5 space-y-4 no-print ${mobileTab === 'preview' ? 'hidden lg:block' : ''}`}>

            {/* Card 1: Guest Particulars */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                <User className="w-4 h-4 text-brand-500" />
                <span>Guest Particulars</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Banerjee"
                    value={billData.customerName}
                    onChange={(e) => setBillData({ ...billData, customerName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex">
                    <select
                      value={billData.countryCode}
                      onChange={(e) => setBillData({ ...billData, countryCode: e.target.value })}
                      className="px-2 py-2 text-xs bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="+91">IN +91</option>
                      <option value="+977">NP +977</option>
                      <option value="+975">BT +975</option>
                      <option value="+880">BD +880</option>
                      <option value="+1">US +1</option>
                    </select>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10-digit number (e.g. 9830124567)"
                      value={billData.customerPhone}
                      onChange={(e) => {
                        const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setBillData({ ...billData, customerPhone: cleanDigits });
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-r-lg font-mono focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Accepts exactly 10 numeric digits</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ID Document Type</label>
                    <select
                      value={billData.idType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setBillData(prev => ({
                          ...prev,
                          idType: newType,
                          idNumber: sanitizeIdNumber(newType, prev.idNumber)
                        }));
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg cursor-pointer"
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="PAN Card">PAN Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ID Number</label>
                    <input
                      type="text"
                      placeholder={
                        billData.idType === 'Aadhaar Card' ? '12 digits (e.g. 784521093321)' :
                        billData.idType === 'Voter ID' ? '10 chars (e.g. WBF1234567)' :
                        billData.idType === 'PAN Card' ? '10 chars (e.g. ABCDE1234F)' :
                        'Max 15 alphanumeric'
                      }
                      value={billData.idNumber}
                      onChange={(e) => {
                        const sanitized = sanitizeIdNumber(billData.idType, e.target.value);
                        setBillData(prev => ({ ...prev, idNumber: sanitized }));
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                    />
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {billData.idType === 'Aadhaar Card' && 'Max 12 digits (Numbers only)'}
                      {billData.idType === 'Voter ID' && 'Max 10 chars (A-Z & 0-9)'}
                      {billData.idType === 'PAN Card' && 'Max 10 chars (A-Z & 0-9)'}
                      {billData.idType === 'Passport' && 'Max 15 chars (alphanumeric)'}
                      {billData.idType === 'Driving License' && 'Max 15 chars (alphanumeric)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Room & Stay Particulars */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                <BedDouble className="w-4 h-4 text-brand-500" />
                <span>Room & Stay Particulars</span>
              </h2>

              <div className="space-y-3">
                
                {/* Room Selector Box */}
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-medium text-slate-500">
                        {billData.selectedRooms && billData.selectedRooms.length > 1 
                          ? `ASSIGNED ROOMS (${billData.selectedRooms.length}):` 
                          : 'ASSIGNED ROOM:'}
                      </span>
                      {billData.selectedRooms && billData.selectedRooms.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {billData.selectedRooms.map(rm => (
                            <div key={rm.roomNumber} className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-blue-300 shadow-2xs">
                              <span className="font-mono text-xs font-extrabold text-blue-900">Room {rm.roomNumber}</span>
                              <span className="text-[10.5px] text-slate-600">({rm.roomType} &bull; ₹{rm.rentPerDay}/d)</span>
                            </div>
                          ))}
                        </div>
                      ) : billData.roomNumber ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-base font-extrabold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-300">
                            Room {billData.roomNumber}
                          </span>
                          <span className="text-xs font-semibold text-blue-800">
                            {billData.roomType} &bull; ₹{billData.roomRentPerDay}/day
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-rose-600 italic block mt-0.5">No room selected. Please click Select Room.</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsRoomSelectorOpen(true)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <BedDouble className="w-3.5 h-3.5" />
                      <span>{billData.roomNumber ? 'Change / Add Rooms' : 'Select Room'}</span>
                    </button>
                  </div>

                  {selectedRoomWarning && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 text-[11px] font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                      <span>{selectedRoomWarning}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Persons</label>
                    <input
                      type="number"
                      min={1}
                      value={billData.numPersons ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBillData(prev => ({ ...prev, numPersons: val === '' ? '' : Math.max(1, parseInt(val) || 1) }));
                      }}
                      onBlur={() => {
                        if (!billData.numPersons || parseInt(billData.numPersons) < 1) {
                          setBillData(prev => ({ ...prev, numPersons: 1 }));
                        }
                      }}
                      onWheel={(e) => e.target.blur()}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">Duration (Days)</label>
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono font-bold">
                        🔒 Auto Calculated
                      </span>
                    </div>
                    <input
                      type="number"
                      readOnly
                      tabIndex={-1}
                      value={billData.numDays}
                      className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-700 cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                {/* Pure Date Pickers (Check-in Date & Check-out Date - strictly validated) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Check-in Date</label>
                    <input
                      type="date"
                      value={billData.checkInDate || (billData.checkInDateTime ? billData.checkInDateTime.slice(0, 10) : todayStr)}
                      onChange={(e) => handleCheckInDateChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">Check-out Date</label>
                      <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                        &gt; Check-in
                      </span>
                    </div>
                    {(() => {
                      const curIn = billData.checkInDate || (billData.checkInDateTime ? billData.checkInDateTime.slice(0, 10) : todayStr);
                      const minOut = getNextDayDateString(curIn);
                      const curOut = billData.checkOutDate || (billData.checkOutDateTime ? billData.checkOutDateTime.slice(0, 10) : minOut);
                      return (
                        <input
                          type="date"
                          min={minOut}
                          value={curOut < minOut ? minOut : curOut}
                          onChange={(e) => handleCheckOutDateChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                        />
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Tariff & Payment */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                <CreditCard className="w-4 h-4 text-brand-500" />
                <span>Tariff & Charges</span>
              </h2>

              <div className="space-y-3">
                
                {/* Dynamic Itemized Room Rent(s) */}
                {billData.selectedRooms && billData.selectedRooms.length > 1 ? (
                  <div className="space-y-2.5 p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-950 pb-1 border-b border-blue-200">
                      <span>Itemized Room Rents ({billData.selectedRooms.length} Rooms):</span>
                      <span className="text-emerald-700 font-extrabold">Combined: ₹{formatINR(totalDailyRent)}/day</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                      {billData.selectedRooms.map((rm) => (
                        <div key={rm.roomNumber} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                          <label className="block text-[11px] font-bold text-slate-800 mb-1">
                            Room {rm.roomNumber} Rent/Day (₹)
                            <span className="font-normal text-slate-500 block text-[10px] truncate">{rm.roomType}</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={rm.rentPerDay ?? ''}
                            onChange={(e) => handleSpecificRoomRateChange(rm.roomNumber, e.target.value)}
                            onWheel={(e) => e.target.blur()}
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Room Rent Per Day (₹) {billData.roomNumber ? `(Room ${billData.roomNumber})` : ''}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={billData.roomRentPerDay ?? ''}
                      onChange={(e) => handleSingleRoomRateChange(e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Extra Guest (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={billData.extraCharges ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBillData(prev => ({ ...prev, extraCharges: val === '' ? '' : Math.max(0, parseFloat(val) || 0) }));
                      }}
                      onWheel={(e) => e.target.blur()}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Advance Paid (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={billData.advancePaid ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBillData(prev => ({ ...prev, advancePaid: val === '' ? '' : Math.max(0, parseFloat(val) || 0) }));
                      }}
                      onWheel={(e) => e.target.blur()}
                      className="w-full px-3 py-2 text-xs font-bold text-emerald-700 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                    <select
                      value={billData.paymentMode}
                      onChange={(e) => setBillData({ ...billData, paymentMode: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg cursor-pointer"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI / QR">UPI / QR (GPay/PhonePe)</option>
                      <option value="Debit / Credit Card">Debit / Credit Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">Invoice Number (Sequential)</label>
                      <span className="text-[10px] text-slate-500 font-mono font-semibold">🔒 Locked</span>
                    </div>
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={billData.invoiceNo}
                      placeholder="e.g. HR/26/00001"
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 border border-slate-300 rounded-lg text-slate-700 cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={billData.remarks}
                    onChange={(e) => setBillData({ ...billData, remarks: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

          </section>

          {/* ======================================= */}
          {/* RIGHT: LIVE PRINTABLE RECEIPT           */}
          {/* ======================================= */}
          <section className={`lg:col-span-7 flex flex-col items-center ${mobileTab === 'form' ? 'hidden lg:flex' : 'flex'} print:!flex print:!w-full print:!block`}>

            {/* Status Indicator */}
            <div className="w-full flex items-center justify-between pb-2 mb-2 text-xs no-print px-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-semibold text-slate-600">Print-Ready Receipt ({hotel.name})</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${balanceDue <= 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                {balanceDue <= 0 ? 'Paid in Full' : `Balance Due: ₹ ${formatINR(balanceDue)}`}
              </span>
            </div>

            {/* The Authentic Invoice Card */}
            <InvoicePreview
              hotel={hotel}
              billData={{ ...billData, showManagerSign: billSettings.showManagerSign }}
              calculations={calculations}
              billSettings={billSettings}
            />

          </section>

        </div>
      </main>

      {/* Room Selector Modal (Supporting Multi-room Booking) */}
      <RoomSelectorModal
        isOpen={isRoomSelectorOpen}
        onClose={() => setIsRoomSelectorOpen(false)}
        hotelId={hotel.hotelId}
        selectedRoomNumber={billData.roomNumber}
        selectedRooms={billData.selectedRooms || []}
        onSelectRooms={handleRoomsSelected}
      />

    </div>
  );
}
