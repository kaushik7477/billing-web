import React, { useState, useEffect } from 'react';
import InvoicePreview from './InvoicePreview';
import { numberToWordsINR, formatINR } from '../utils/numberToWords';
import { 
  Building2, Printer, Download, Share2, Save, History, 
  RotateCcw, Sparkles, LogOut, BedDouble, User, Calendar, 
  CreditCard, CheckCircle2, ChevronRight, Phone
} from 'lucide-react';

export default function BillingEngine({ hotel, token, onLogout, onOpenHistory }) {
  // Current date initialization
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedBillDate = `${String(now.getDate()).padStart(2, '0')}-${months[now.getMonth()]}-${now.getFullYear()}`;

  // Form State
  const [billData, setBillData] = useState({
    invoiceNo: `${hotel.hotelId === 'hotel-1' ? 'HR' : hotel.hotelId === 'hotel-2' ? 'HSP' : 'HSP2'}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    billDate: formattedBillDate,
    customerName: 'Rahul Banerjee',
    countryCode: '+91',
    customerPhone: '9830124567',
    idType: 'Aadhaar Card',
    idNumber: '7845 2109 3321',
    roomType: hotel.roomTypes?.[1]?.name || 'Deluxe Room',
    roomNumber: '204, 205',
    numPersons: 3,
    checkInDateTime: `${todayStr}T12:00`,
    checkOutDateTime: `${todayStr}T11:00`,
    numDays: 2,
    roomRentPerDay: hotel.roomTypes?.[1]?.defaultRent || 2200,
    extraCharges: 500,
    advancePaid: 1500,
    paymentMode: 'Cash',
    remarks: 'Extra mattress provided. Room checked out in clean condition.',
    showManagerSign: true
  });

  const [autoCalcDays, setAutoCalcDays] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mobileTab, setMobileTab] = useState('form'); // 'form' or 'preview'
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Auto calculate days between checkin and checkout
  useEffect(() => {
    if (!billData.checkInDateTime || !billData.checkOutDateTime) return;
    const d1 = new Date(billData.checkInDateTime);
    const d2 = new Date(billData.checkOutDateTime);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return;

    const diffHours = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60);
    const calcDays = Math.max(1, Math.round(diffHours / 24));
    
    if (autoCalcDays) {
      setBillData(prev => ({ ...prev, numDays: calcDays }));
    }
  }, [billData.checkInDateTime, billData.checkOutDateTime, autoCalcDays]);

  // Handle Room Type Change
  const handleRoomTypeChange = (e) => {
    const selectedName = e.target.value;
    const foundRoom = hotel.roomTypes?.find(r => r.name === selectedName);
    setBillData(prev => ({
      ...prev,
      roomType: selectedName,
      roomRentPerDay: foundRoom ? foundRoom.defaultRent : prev.roomRentPerDay
    }));
  };

  // Perform Calculations
  const roomRent = Math.max(0, parseFloat(billData.roomRentPerDay) || 0);
  const days = Math.max(1, parseInt(billData.numDays) || 1);
  const extra = Math.max(0, parseFloat(billData.extraCharges) || 0);
  const advance = Math.max(0, parseFloat(billData.advancePaid) || 0);

  const baseAccommodation = roomRent * days;
  const subtotal = baseAccommodation + extra;

  const cgst = Math.round((subtotal * 0.025) * 100) / 100;
  const sgst = Math.round((subtotal * 0.025) * 100) / 100;
  const totalGst = cgst + sgst;

  const netTotal = Math.round((subtotal + totalGst) * 100) / 100;
  const balanceDue = Math.round((netTotal - advance) * 100) / 100;
  const amountInWords = numberToWordsINR(balanceDue > 0 ? balanceDue : netTotal);

  const calculations = {
    roomRentPerDay: roomRent,
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

  // Save Bill to Backend MongoDB / Database
  const handleSaveBill = async () => {
    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      const payload = {
        ...billData,
        ...calculations,
        hotelId: hotel.hotelId,
        hotelName: hotel.name,
        paymentStatus: balanceDue <= 0 ? 'PAID' : 'DUE'
      };

      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg(`Bill ${data.bill.invoiceNo} saved successfully to database!`);
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
🛏️ *Room:* ${billData.roomType} (Room ${billData.roomNumber})
⏳ *Duration:* ${billData.numDays} Day(s)
━━━━━━━━━━━━━━━━━━━━━
💰 *Net Total Bill:* ₹ ${formatINR(netTotal)}
💳 *Advance Paid:* ₹ ${formatINR(advance)}
🏷️ *Balance Due:* ₹ ${formatINR(balanceDue)}
━━━━━━━━━━━━━━━━━━━━━
🙏 *Thank you for staying at ${hotel.name}!* Have a safe and pleasant journey!`;

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Download PDF
  const handleDownloadPDF = () => {
    const el = document.getElementById('invoice-card');
    if (window.html2pdf && el) {
      window.html2pdf().set({
        margin: [6, 8, 6, 8],
        filename: `${hotel.name.replace(/\s+/g, '-')}-Invoice-${billData.invoiceNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(el).save();
    } else {
      window.print();
    }
  };

  // Reset Form
  const handleReset = () => {
    if (window.confirm('Start new invoice? Current unsaved entries will be reset.')) {
      setBillData(prev => ({
        ...prev,
        invoiceNo: `${hotel.hotelId === 'hotel-1' ? 'HR' : hotel.hotelId === 'hotel-2' ? 'HSP' : 'HSP2'}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: '',
        customerPhone: '',
        idNumber: '',
        roomNumber: '',
        numPersons: 2,
        extraCharges: 0,
        advancePaid: 0,
        remarks: ''
      }));
    }
  };

  // Load sample data
  const handleLoadSample = () => {
    setBillData(prev => ({
      ...prev,
      customerName: 'Sourav Ganguly',
      customerPhone: '9831098765',
      idType: 'Aadhaar Card',
      idNumber: '4521 8974 6502',
      roomType: hotel.roomTypes?.[2]?.name || 'Super Deluxe Room',
      roomRentPerDay: hotel.roomTypes?.[2]?.defaultRent || 3000,
      roomNumber: '302',
      numPersons: 4,
      extraCharges: 600,
      advancePaid: 2000,
      paymentMode: 'UPI / QR',
      remarks: 'Late checkout approved till 1:00 PM. Complimentary breakfast included.'
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      
      {/* Top Navbar */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Active Hotel Brand */}
          <div className="flex items-center space-x-3">
            <div 
              style={{ backgroundColor: hotel.themeColor || '#1a365d' }}
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-serif font-bold text-xl shadow-md"
            >
              {hotel.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                  {hotel.name}
                </h1>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Manager POS
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {hotel.subText} &bull; {hotel.phone}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={handleLoadSample}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1"
              title="Load demo data"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Sample</span>
            </button>

            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1"
              title="New blank bill"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">New</span>
            </button>

            <button
              onClick={handleSaveBill}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Bill'}</span>
            </button>

            <button
              onClick={onOpenHistory}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1"
              title="View past bills"
            >
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Records</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="px-2.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm flex items-center gap-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-2.5 py-1.5 text-xs font-medium text-white bg-brand-700 hover:bg-brand-800 rounded-lg transition shadow-sm flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg transition shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-2"
              title="Switch Property / Exit"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="no-print lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-center gap-2 sticky top-16 z-30">
        <button
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition ${
            mobileTab === 'form' ? 'bg-brand-800 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
          }`}
        >
          Edit Particulars
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition ${
            mobileTab === 'preview' ? 'bg-brand-800 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
          }`}
        >
          Live Receipt
        </button>
      </div>

      {/* Success Notification Bar */}
      {saveSuccessMsg && (
        <div className="no-print bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Workspace Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ======================================= */}
          {/* LEFT: INPUT CONTROLS                    */}
          {/* ======================================= */}
          <section className={`lg:col-span-5 space-y-4 no-print ${mobileTab === 'preview' ? 'hidden lg:block' : ''}`}>
            
            {/* Card 1: Guest Information */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                <User className="w-4 h-4 text-brand-500" />
                <span>Guest Particulars</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={billData.customerName}
                    onChange={(e) => setBillData({ ...billData, customerName: e.target.value })}
                    placeholder="e.g., Rajesh Sharma"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <div className="flex rounded-lg shadow-sm">
                    <select
                      value={billData.countryCode}
                      onChange={(e) => setBillData({ ...billData, countryCode: e.target.value })}
                      className="px-2.5 py-2 text-xs bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-slate-700 font-medium"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+880">🇧🇩 +880</option>
                      <option value="+977">🇳🇵 +977</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                    </select>
                    <input
                      type="tel"
                      value={billData.customerPhone}
                      onChange={(e) => setBillData({ ...billData, customerPhone: e.target.value })}
                      placeholder="10-digit mobile"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ID Document Type</label>
                    <select
                      value={billData.idType}
                      onChange={(e) => setBillData({ ...billData, idType: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                      value={billData.idNumber}
                      onChange={(e) => setBillData({ ...billData, idNumber: e.target.value })}
                      placeholder="ID / Card No"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Room Category</label>
                    <select
                      value={billData.roomType}
                      onChange={handleRoomTypeChange}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                    >
                      {hotel.roomTypes?.map((r, i) => (
                        <option key={i} value={r.name}>{r.name} (₹{r.defaultRent})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Room No(s)</label>
                    <input
                      type="text"
                      value={billData.roomNumber}
                      onChange={(e) => setBillData({ ...billData, roomNumber: e.target.value })}
                      placeholder="e.g., 204 or 204, 205"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Persons</label>
                    <input
                      type="number"
                      min={1}
                      value={billData.numPersons}
                      onChange={(e) => setBillData({ ...billData, numPersons: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">Duration (Days)</label>
                      <span className="text-[10px] text-brand-700 bg-brand-50 px-1 rounded font-bold">Auto</span>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={billData.numDays}
                      onChange={(e) => {
                        setAutoCalcDays(false);
                        setBillData({ ...billData, numDays: e.target.value });
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Check-in Time</label>
                    <input
                      type="datetime-local"
                      value={billData.checkInDateTime}
                      onChange={(e) => {
                        setAutoCalcDays(true);
                        setBillData({ ...billData, checkInDateTime: e.target.value });
                      }}
                      className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Check-out Time</label>
                    <input
                      type="datetime-local"
                      value={billData.checkOutDateTime}
                      onChange={(e) => {
                        setAutoCalcDays(true);
                        setBillData({ ...billData, checkOutDateTime: e.target.value });
                      }}
                      className="w-full px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                    />
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Rent Per Day (₹)</label>
                  <input
                    type="number"
                    value={billData.roomRentPerDay}
                    onChange={(e) => setBillData({ ...billData, roomRentPerDay: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Extra Guest (₹)</label>
                    <input
                      type="number"
                      value={billData.extraCharges}
                      onChange={(e) => setBillData({ ...billData, extraCharges: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Advance Paid (₹)</label>
                    <input
                      type="number"
                      value={billData.advancePaid}
                      onChange={(e) => setBillData({ ...billData, advancePaid: e.target.value })}
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
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI / QR">UPI / QR (GPay/PhonePe)</option>
                      <option value="Debit / Credit Card">Debit / Credit Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Number</label>
                    <input
                      type="text"
                      value={billData.invoiceNo}
                      onChange={(e) => setBillData({ ...billData, invoiceNo: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg"
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
          <section className={`lg:col-span-7 flex flex-col items-center ${mobileTab === 'form' ? 'hidden lg:flex' : 'flex'}`}>
            
            {/* Status Indicator */}
            <div className="w-full flex items-center justify-between pb-2 mb-2 text-xs no-print px-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-semibold text-slate-600">Print-Ready Receipt ({hotel.name})</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                balanceDue <= 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {balanceDue <= 0 ? 'Paid in Full' : `Balance Due: ₹ ${formatINR(balanceDue)}`}
              </span>
            </div>

            {/* The Authentic Invoice Card */}
            <InvoicePreview hotel={hotel} billData={billData} calculations={calculations} />

          </section>

        </div>
      </main>

    </div>
  );
}
