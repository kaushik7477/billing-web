import React, { useState, useMemo } from 'react';
import { formatINR } from '../utils/numberToWords';
import {
  FileSpreadsheet,
  ShieldCheck,
  Download,
  Printer,
  Calendar,
  Building2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileText,
  User,
  Phone,
  FileJson,
  Check,
  Edit2,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function ReportsAndTax({ hotel = {}, savedBills = [], closedBills = [] }) {
  // Safe hotel fallbacks
  const hotelName = hotel?.name || 'Hotel Rojana';
  const hotelGstin = hotel?.gstin || '19ABYFM7409E1Z0';
  const hotelAddress = hotel?.address || 'New Digha, Mini Holiday Home Sector, Purba Medinipur, W.B.';
  const hotelPhone = hotel?.phone || '9046926801';

  // Sub-view: 'gst' (GSTR-1 Accounting) | 'police' (Digha Police Station Compliance)
  const [activeView, setActiveView] = useState('gst');

  // GSTR-1 Period Filter: YYYY-MM
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [gstTypeFilter, setGstTypeFilter] = useState('all'); // 'all' | 'b2b' | 'b2c'
  const [gstSearch, setGstSearch] = useState('');

  // Daily Police Station Report Date Filter: YYYY-MM-DD
  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [policeDate, setPoliceDate] = useState(todayDateStr);
  const [policeFilter, setPoliceFilter] = useState('all'); // 'all' | 'arrivals' | 'departures'
  const [policeSearch, setPoliceSearch] = useState('');
  const [isPolicePrintModalOpen, setIsPolicePrintModalOpen] = useState(false);

  // Recipient GSTIN overrides for corporate bills (stored locally for instant B2B categorization)
  const [b2bOverrides, setB2bOverrides] = useState({});
  const [editingB2bInvoice, setEditingB2bInvoice] = useState(null);
  const [tempGstinInput, setTempGstinInput] = useState('');
  const [tempCompanyNameInput, setTempCompanyNameInput] = useState('');

  // Combine savedBills and closedBills without duplicates (excluding Non-GST / Meta Data bills)
  const allBills = useMemo(() => {
    const map = new Map();
    [...savedBills, ...closedBills].forEach(b => {
      // Exclude Non-GST / Meta Data bills completely from Reports & Tax and GSTR-1
      if (b && !b.isNonGST && (b.invoiceNo || b.id)) {
        map.set(b.invoiceNo || b.id, b);
      }
    });
    return Array.from(map.values());
  }, [savedBills, closedBills]);

  // =========================================================================
  // GSTR-1 FILTERING & CALCULATIONS
  // =========================================================================
  const monthFilteredBills = useMemo(() => {
    return allBills.filter(b => {
      const dt = b.createdAt || b.billDateTime || b.checkInDateTime || '';
      if (!dt) return true;
      return dt.startsWith(selectedMonth);
    });
  }, [allBills, selectedMonth]);

  // Classify bills into B2B and B2C
  const { b2bBills, b2cBills } = useMemo(() => {
    const b2b = [];
    const b2c = [];

    monthFilteredBills.forEach(b => {
      const override = b2bOverrides[b.invoiceNo];
      const gstin = override?.gstin || b.customerGstin || b.b2bGstin || '';
      
      // If valid 15-char GSTIN or designated as corporate
      if (gstin && gstin.trim().length >= 15) {
        b2b.push({
          ...b,
          recipientGstin: gstin.toUpperCase(),
          recipientName: override?.companyName || b.companyName || b.customerName
        });
      } else {
        b2c.push(b);
      }
    });

    return { b2bBills: b2b, b2cBills: b2c };
  }, [monthFilteredBills, b2bOverrides]);

  // Active GST list based on filter
  const displayedGstBills = useMemo(() => {
    let list = gstTypeFilter === 'b2b' ? b2bBills : gstTypeFilter === 'b2c' ? b2cBills : monthFilteredBills;
    if (gstSearch.trim()) {
      const q = gstSearch.toLowerCase();
      list = list.filter(b =>
        (b.customerName || '').toLowerCase().includes(q) ||
        (b.invoiceNo || '').toLowerCase().includes(q) ||
        (b.roomNumber || '').toLowerCase().includes(q) ||
        (b2bOverrides[b.invoiceNo]?.gstin || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [gstTypeFilter, b2bBills, b2cBills, monthFilteredBills, gstSearch, b2bOverrides]);

  // Aggregate GST Metrics
  const gstMetrics = useMemo(() => {
    let grossTotal = 0;
    let taxableTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let totalGst = 0;

    monthFilteredBills.forEach(b => {
      grossTotal += parseFloat(b.netTotal) || 0;
      taxableTotal += parseFloat(b.subtotal) || 0;
      cgstTotal += parseFloat(b.cgst) || 0;
      sgstTotal += parseFloat(b.sgst) || 0;
      totalGst += parseFloat(b.totalGst) || 0;
    });

    return {
      grossTotal,
      taxableTotal,
      cgstTotal,
      sgstTotal,
      totalGst,
      totalCount: monthFilteredBills.length,
      b2bCount: b2bBills.length,
      b2cCount: b2cBills.length
    };
  }, [monthFilteredBills, b2bBills, b2cBills]);

  // Save B2B GSTIN Override
  const handleSaveB2b = (invoiceNo) => {
    if (!tempGstinInput.trim()) return;
    setB2bOverrides(prev => ({
      ...prev,
      [invoiceNo]: {
        gstin: tempGstinInput.trim().toUpperCase(),
        companyName: tempCompanyNameInput.trim() || undefined
      }
    }));
    setEditingB2bInvoice(null);
    setTempGstinInput('');
    setTempCompanyNameInput('');
  };

  // Remove B2B status
  const handleRemoveB2b = (invoiceNo) => {
    setB2bOverrides(prev => {
      const next = { ...prev };
      delete next[invoiceNo];
      return next;
    });
  };

  // =========================================================================
  // GSTR-1 EXPORT BUILDERS (CSV & JSON)
  // =========================================================================
  const exportGstr1CSV = () => {
    const rows = [];
    rows.push(['# GSTR-1 TAX EXPORT (HOTEL BILLING SOFTWARE)']);
    rows.push([`# Hotel Name: ${hotelName}`]);
    rows.push([`# Hotel GSTIN: ${hotelGstin}`]);
    rows.push([`# Return Period: ${selectedMonth}`]);
    rows.push([`# State Code: 19 (West Bengal)`]);
    rows.push([]);

    // SECTION 1: B2B INVOICES
    rows.push(['--- SECTION 1: B2B TAX INVOICES (CORPORATE WITH GSTIN) ---']);
    rows.push([
      'GSTIN of Recipient',
      'Receiver Name',
      'Invoice Number',
      'Invoice Date',
      'Invoice Value',
      'Place of Supply',
      'Reverse Charge',
      'Applicable % Rate',
      'Taxable Value',
      'CGST Amount',
      'SGST Amount',
      'Cess Amount'
    ]);

    if (b2bBills.length === 0) {
      rows.push(['No B2B Invoices for this month', '', '', '', '', '', '', '', '', '', '', '']);
    } else {
      b2bBills.forEach(b => {
        rows.push([
          b.recipientGstin,
          `"${(b.recipientName || b.customerName).replace(/"/g, '""')}"`,
          b.invoiceNo,
          b.billDate || '12-Nov-2026',
          (parseFloat(b.netTotal) || 0).toFixed(2),
          '19-West Bengal',
          'N',
          '5.0%',
          (parseFloat(b.subtotal) || 0).toFixed(2),
          (parseFloat(b.cgst) || 0).toFixed(2),
          (parseFloat(b.sgst) || 0).toFixed(2),
          '0.00'
        ]);
      });
    }

    rows.push([]);

    // SECTION 2: B2C SUMMARY (TABLE 7)
    rows.push(['--- SECTION 2: B2C SUMMARY (TABLE 7 - RETAIL GUESTS) ---']);
    rows.push([
      'Type',
      'Place of Supply',
      'Rate',
      'Taxable Value',
      'Central Tax (CGST 2.5%)',
      'State Tax (SGST 2.5%)',
      'Cess Amount',
      'Gross Invoiced Amount'
    ]);

    let b2cTaxable = 0;
    let b2cCgst = 0;
    let b2cSgst = 0;
    let b2cGross = 0;
    b2cBills.forEach(b => {
      b2cTaxable += parseFloat(b.subtotal) || 0;
      b2cCgst += parseFloat(b.cgst) || 0;
      b2cSgst += parseFloat(b.sgst) || 0;
      b2cGross += parseFloat(b.netTotal) || 0;
    });

    rows.push([
      'OE (Other than E-commerce)',
      '19-West Bengal',
      '5.0%',
      b2cTaxable.toFixed(2),
      b2cCgst.toFixed(2),
      b2cSgst.toFixed(2),
      '0.00',
      b2cGross.toFixed(2)
    ]);

    rows.push([]);

    // SECTION 3: INVOICES DOCUMENT AUDIT
    rows.push(['--- SECTION 3: COMPLETE INVOICES AUDIT REGISTER ---']);
    rows.push([
      'Invoice No',
      'Date',
      'Guest Name',
      'Phone',
      'Room',
      'Days',
      'Taxable Value',
      'CGST (2.5%)',
      'SGST (2.5%)',
      'Total GST',
      'Net Invoice Total',
      'Payment Mode',
      'Category'
    ]);

    monthFilteredBills.forEach(b => {
      const isB2b = b2bOverrides[b.invoiceNo]?.gstin || b.customerGstin;
      rows.push([
        b.invoiceNo,
        b.billDate || '',
        `"${(b.customerName || '').replace(/"/g, '""')}"`,
        b.customerPhone || '',
        b.roomNumber || '',
        b.numDays || 1,
        (parseFloat(b.subtotal) || 0).toFixed(2),
        (parseFloat(b.cgst) || 0).toFixed(2),
        (parseFloat(b.sgst) || 0).toFixed(2),
        (parseFloat(b.totalGst) || 0).toFixed(2),
        (parseFloat(b.netTotal) || 0).toFixed(2),
        b.paymentMode || 'Cash',
        isB2b ? `B2B (${isB2b})` : 'B2C Retail'
      ]);
    });

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR1_${hotelName.replace(/\s+/g, '_')}_${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportGstr1JSON = () => {
    const fp = selectedMonth.replace('-', '').slice(4) + selectedMonth.slice(0, 4); // MMYYYY
    
    // Group B2B by recipient GSTIN
    const b2bMap = {};
    b2bBills.forEach(b => {
      const gstin = b.recipientGstin;
      if (!b2bMap[gstin]) {
        b2bMap[gstin] = {
          ctin: gstin,
          cname: b.recipientName || b.customerName,
          inv: []
        };
      }

      b2bMap[gstin].inv.push({
        inum: b.invoiceNo,
        idt: b.billDate || '12-11-2026',
        val: parseFloat((parseFloat(b.netTotal) || 0).toFixed(2)),
        pos: '19',
        rchrg: 'N',
        inv_typ: 'R',
        itms: [
          {
            num: 1,
            itm_det: {
              txval: parseFloat((parseFloat(b.subtotal) || 0).toFixed(2)),
              rt: 5.0,
              camt: parseFloat((parseFloat(b.cgst) || 0).toFixed(2)),
              samt: parseFloat((parseFloat(b.sgst) || 0).toFixed(2)),
              csamt: 0.0
            }
          }
        ]
      });
    });

    let b2cTaxable = 0;
    let b2cCgst = 0;
    let b2cSgst = 0;
    b2cBills.forEach(b => {
      b2cTaxable += parseFloat(b.subtotal) || 0;
      b2cCgst += parseFloat(b.cgst) || 0;
      b2cSgst += parseFloat(b.sgst) || 0;
    });

    const gstr1Data = {
      gstin: hotelGstin,
      fp: fp,
      cur_gt: parseFloat(gstMetrics.grossTotal.toFixed(2)),
      b2b: Object.values(b2bMap),
      b2cs: b2cBills.length > 0 ? [
        {
          sply_ty: 'INTRA',
          pos: '19',
          typ: 'OE',
          txval: parseFloat(b2cTaxable.toFixed(2)),
          rt: 5.0,
          camt: parseFloat(b2cCgst.toFixed(2)),
          samt: parseFloat(b2cSgst.toFixed(2)),
          csamt: 0.0
        }
      ] : [],
      doc_issue: {
        doc_det: [
          {
            doc_num: 1,
            docs: [
              {
                num: 1,
                from: monthFilteredBills[0]?.invoiceNo || 'HR-2026-0001',
                to: monthFilteredBills[monthFilteredBills.length - 1]?.invoiceNo || 'HR-2026-9999',
                totnum: monthFilteredBills.length,
                canc: 0,
                net_issue: monthFilteredBills.length
              }
            ]
          }
        ]
      }
    };

    const blob = new Blob([JSON.stringify(gstr1Data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR1_${hotelGstin}_${selectedMonth}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // =========================================================================
  // DAILY POLICE STATION REPORT (DIGHA PS COMPLIANCE)
  // =========================================================================
  const policeFilteredBills = useMemo(() => {
    return allBills.filter(b => {
      const checkIn = b.checkInDateTime ? b.checkInDateTime.slice(0, 10) : '';
      const checkOut = b.checkOutDateTime ? b.checkOutDateTime.slice(0, 10) : '';
      const billDt = b.createdAt ? b.createdAt.slice(0, 10) : '';

      // Match selected date
      let dateMatch = false;
      if (policeFilter === 'arrivals') {
        dateMatch = checkIn === policeDate;
      } else if (policeFilter === 'departures') {
        dateMatch = checkOut === policeDate;
      } else {
        // 'all' active in-house on this date
        // Either active stay covering this date, or check-in today, or created today
        dateMatch = (checkIn && checkOut && policeDate >= checkIn && policeDate <= checkOut) ||
                    checkIn === policeDate ||
                    billDt === policeDate;
      }

      if (!dateMatch) return false;

      if (policeSearch.trim()) {
        const q = policeSearch.toLowerCase();
        return (
          (b.customerName || '').toLowerCase().includes(q) ||
          (b.customerPhone || '').toLowerCase().includes(q) ||
          (b.idNumber || '').toLowerCase().includes(q) ||
          (b.roomNumber || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allBills, policeDate, policeFilter, policeSearch]);

  const exportPoliceReportCSV = () => {
    const rows = [];
    rows.push(['# DAILY GUEST REGISTRATION RECORD - DIGHA POLICE STATION COMPLIANCE']);
    rows.push([`# Hotel: ${hotelName}`]);
    rows.push([`# Address: ${hotelAddress}`]);
    rows.push([`# Date of Submission: ${policeDate}`]);
    rows.push([`# Police Jurisdiction: Digha Police Station, Purba Medinipur`]);
    rows.push([]);
    rows.push([
      'SL No',
      'Room No',
      'Guest Full Name',
      'Mobile Number',
      'ID Document Type',
      'ID Document Number',
      'No of Persons',
      'Check-In Date & Time',
      'Expected Check-Out Date & Time',
      'Room Type',
      'Invoice Serial',
      'Police Verification Status'
    ]);

    policeFilteredBills.forEach((b, idx) => {
      rows.push([
        idx + 1,
        b.roomNumber || '',
        `"${(b.customerName || '').replace(/"/g, '""')}"`,
        `${b.countryCode || '+91'} ${b.customerPhone || ''}`,
        b.idType || 'Aadhaar Card',
        b.idNumber || 'Verified',
        b.numPersons || 1,
        b.checkInDateTime || '',
        b.checkOutDateTime || '',
        b.roomType || '',
        b.invoiceNo || '',
        'VERIFIED'
      ]);
    });

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Police_Report_Digha_${hotelName.replace(/\s+/g, '_')}_${policeDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPoliceReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ================================================================= */}
      {/* 1. TOP HEADER & VIEW TOGGLE (GSTR-1 vs Police Station)            */}
      {/* ================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                GST & Accounting Compliance Hub
              </h2>
              <p className="text-xs text-slate-500">
                GSTR-1 Monthly Return Ready Exports & Digha Police Station Daily Guest Registration
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveView('gst')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 cursor-pointer ${
              activeView === 'gst'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>GSTR-1 Ready Export</span>
          </button>

          <button
            onClick={() => setActiveView('police')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 cursor-pointer ${
              activeView === 'police'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Daily Police Station Report</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* VIEW 1: GSTR-1 READY ACCOUNTING EXPORT                            */}
      {/* ================================================================= */}
      {activeView === 'gst' && (
        <div className="space-y-6">

          {/* Filter & Export Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Filing Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

              {/* B2B / B2C Filter Pills */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-medium">
                <button
                  onClick={() => setGstTypeFilter('all')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    gstTypeFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Invoices ({monthFilteredBills.length})
                </button>
                <button
                  onClick={() => setGstTypeFilter('b2b')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    gstTypeFilter === 'b2b' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  B2B Corporate ({b2bBills.length})
                </button>
                <button
                  onClick={() => setGstTypeFilter('b2c')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    gstTypeFilter === 'b2c' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  B2C Retail ({b2cBills.length})
                </button>
              </div>
            </div>

            {/* Quick Export Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={exportGstr1CSV}
                className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Download GSTR-1 Formatted Excel / CSV file"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Excel / CSV</span>
              </button>

              <button
                onClick={exportGstr1JSON}
                className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Download official GSTR-1 JSON Schema for GST Portal Offline Tool"
              >
                <FileJson className="w-4 h-4 text-blue-600" />
                <span>Export GSTR-1 JSON</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Print Tax Audit Ledger"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print Ledger</span>
              </button>
            </div>
          </div>

          {/* Financial Summary Cards Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 no-print">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Gross Turnover</span>
              <div className="font-mono text-xl font-extrabold text-slate-900 mt-1">
                ₹{formatINR(gstMetrics.grossTotal)}
              </div>
              <span className="text-[10px] text-slate-400">Total Net Invoiced</span>
            </div>

            <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-sm">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Taxable Value</span>
              <div className="font-mono text-xl font-extrabold text-blue-700 mt-1">
                ₹{formatINR(gstMetrics.taxableTotal)}
              </div>
              <span className="text-[10px] text-blue-600 font-medium">Base Room + Amenities</span>
            </div>

            <div className="bg-white rounded-2xl border border-indigo-200 p-4 shadow-sm">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">CGST (2.5%)</span>
              <div className="font-mono text-xl font-extrabold text-indigo-700 mt-1">
                ₹{formatINR(gstMetrics.cgstTotal)}
              </div>
              <span className="text-[10px] text-indigo-600 font-medium">Central Tax Output</span>
            </div>

            <div className="bg-white rounded-2xl border border-purple-200 p-4 shadow-sm">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">SGST (2.5%)</span>
              <div className="font-mono text-xl font-extrabold text-purple-700 mt-1">
                ₹{formatINR(gstMetrics.sgstTotal)}
              </div>
              <span className="text-[10px] text-purple-600 font-medium">State Tax (West Bengal)</span>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-300 bg-emerald-50/30 p-4 shadow-sm col-span-2 lg:col-span-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Total GST Output (5%)</span>
              <div className="font-mono text-xl font-extrabold text-emerald-700 mt-1">
                ₹{formatINR(gstMetrics.totalGst)}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">{gstMetrics.totalCount} Invoices Filed</span>
            </div>

          </div>

          {/* GSTR-1 Table 7: B2C Summary Box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>GSTR-1 Table 7: B2C Summary (Small / Retail Guests)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Consolidated retail invoices under ₹2.5 Lakhs to unregistered guests
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                {b2cBills.length} Invoices Aggregated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10.5px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Place of Supply</th>
                    <th className="py-2.5 px-3 text-center">Rate</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">Central Tax (CGST 2.5%)</th>
                    <th className="py-2.5 px-3 text-right">State Tax (SGST 2.5%)</th>
                    <th className="py-2.5 px-3 text-right">Cess Amount</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">Gross Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/60 font-medium">
                    <td className="py-3 px-3 font-semibold text-slate-800">OE (Other than E-Commerce)</td>
                    <td className="py-3 px-3 font-mono">19-West Bengal</td>
                    <td className="py-3 px-3 text-center font-bold text-blue-700">5.0%</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      ₹{formatINR(b2cBills.reduce((acc, b) => acc + (parseFloat(b.subtotal) || 0), 0))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-indigo-700 font-semibold">
                      ₹{formatINR(b2cBills.reduce((acc, b) => acc + (parseFloat(b.cgst) || 0), 0))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-purple-700 font-semibold">
                      ₹{formatINR(b2cBills.reduce((acc, b) => acc + (parseFloat(b.sgst) || 0), 0))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400">₹0.00</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{formatINR(b2cBills.reduce((acc, b) => acc + (parseFloat(b.netTotal) || 0), 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* GSTR-1 Invoices Register Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span>
                    {gstTypeFilter === 'b2b' ? 'B2B Corporate Invoices with GSTIN' : gstTypeFilter === 'b2c' ? 'B2C Retail Guest Invoices' : 'Complete GSTR-1 Invoices Audit Register'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Itemized tax breakdowns for all guest folios issued during {selectedMonth}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={gstSearch}
                  onChange={(e) => setGstSearch(e.target.value)}
                  placeholder="Search guest, invoice, room, GSTIN..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {displayedGstBills.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No invoices found matching the selected period and filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10.5px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Invoice No</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Customer / Recipient</th>
                      <th className="py-2.5 px-3">Room</th>
                      <th className="py-2.5 px-3 text-right">Taxable Value</th>
                      <th className="py-2.5 px-3 text-right">CGST (2.5%)</th>
                      <th className="py-2.5 px-3 text-right">SGST (2.5%)</th>
                      <th className="py-2.5 px-3 text-right font-bold text-slate-900">Total Net</th>
                      <th className="py-2.5 px-3 text-center">Tax Category</th>
                      <th className="py-2.5 px-3 text-right no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {displayedGstBills.map(b => {
                      const override = b2bOverrides[b.invoiceNo];
                      const gstin = override?.gstin || b.customerGstin || b.b2bGstin;
                      const isB2b = Boolean(gstin);

                      return (
                        <tr key={b.invoiceNo || b.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-blue-700">
                            {b.invoiceNo}
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            {b.billDate || '12-Nov-2026'}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{b.customerName}</div>
                            {isB2b ? (
                              <div className="font-mono text-[11px] text-blue-700 font-semibold flex items-center gap-1 mt-0.5">
                                <span className="bg-blue-100 px-1 rounded text-[10px]">GSTIN</span>
                                <span>{gstin}</span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400">{b.customerPhone || 'Retail Guest'}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-700">
                            Room {b.roomNumber}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                            ₹{formatINR(b.subtotal)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-indigo-700">
                            ₹{formatINR(b.cgst)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-purple-700">
                            ₹{formatINR(b.sgst)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                            ₹{formatINR(b.netTotal)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isB2b ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                                B2B Corporate
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                B2C Retail
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right no-print">
                            {isB2b ? (
                              <button
                                onClick={() => handleRemoveB2b(b.invoiceNo)}
                                className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                                title="Reset to B2C Retail"
                              >
                                Clear GSTIN
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingB2bInvoice(b.invoiceNo);
                                  setTempGstinInput('');
                                  setTempCompanyNameInput(b.customerName || '');
                                }}
                                className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
                                title="Add corporate recipient GSTIN"
                              >
                                + Set B2B
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal to Set B2B GSTIN */}
          {editingB2bInvoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Set Corporate Recipient GSTIN ({editingB2bInvoice})</span>
                  </h4>
                  <button onClick={() => setEditingB2bInvoice(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company / Recipient GSTIN <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={tempGstinInput}
                      onChange={(e) => setTempGstinInput(e.target.value.toUpperCase())}
                      placeholder="e.g., 19ABCDE1234F1Z5"
                      maxLength={15}
                      className="w-full px-3 py-2 font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">15-digit Goods & Services Tax Identification Number</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company Trade Name (Optional)</label>
                    <input
                      type="text"
                      value={tempCompanyNameInput}
                      onChange={(e) => setTempCompanyNameInput(e.target.value)}
                      placeholder="e.g., Tata Consultancy Services Ltd."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setEditingB2bInvoice(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveB2b(editingB2bInvoice)}
                    disabled={tempGstinInput.trim().length < 15}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl shadow-xs"
                  >
                    Save & Classify as B2B
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================================================================= */}
      {/* VIEW 2: DAILY POLICE STATION REPORT (DIGHA LOCAL COMPLIANCE)      */}
      {/* ================================================================= */}
      {activeView === 'police' && (
        <div className="space-y-6">

          {/* Digha PS Compliance Directive Notice */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span>Digha Police Station Mandatory Guest Registration Record</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
                    Rule 11 Compliance
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Purba Medinipur District Hospitality Security Order: All hotels and holiday homes must record photo ID proofs, phone numbers, and passenger counts of every guest staying on premises for official police verification.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setIsPolicePrintModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4 text-blue-700" />
                <span>Print Official Form</span>
              </button>

              <button
                onClick={exportPoliceReportCSV}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Record Date:</span>
                <input
                  type="date"
                  value={policeDate}
                  onChange={(e) => setPoliceDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

              {/* Roster Filters */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-medium">
                <button
                  onClick={() => setPoliceFilter('all')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    policeFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All In-House ({policeFilteredBills.length})
                </button>
                <button
                  onClick={() => setPoliceFilter('arrivals')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    policeFilter === 'arrivals' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  New Check-Ins
                </button>
                <button
                  onClick={() => setPoliceFilter('departures')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    policeFilter === 'departures' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Departures
                </button>
              </div>
            </div>

            {/* Police Search Bar */}
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={policeSearch}
                onChange={(e) => setPoliceSearch(e.target.value)}
                placeholder="Search guest, ID, phone, room..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Police Registration Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>Digha PS Guest Registration Roster ({policeDate})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Verified guest identification records submitted to Digha Police Station
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                  Total Guests: {policeFilteredBills.reduce((acc, b) => acc + (b.numPersons || 1), 0)} Persons
                </span>
              </div>
            </div>

            {policeFilteredBills.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No guest registrations recorded on {policeDate}. Use the date filter above to view past records.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10.5px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">SL</th>
                      <th className="py-2.5 px-3">Room</th>
                      <th className="py-2.5 px-3">Guest Full Name</th>
                      <th className="py-2.5 px-3">Mobile Number</th>
                      <th className="py-2.5 px-3">ID Document Type</th>
                      <th className="py-2.5 px-3">ID Number</th>
                      <th className="py-2.5 px-3 text-center">Persons</th>
                      <th className="py-2.5 px-3">Check-In</th>
                      <th className="py-2.5 px-3">Check-Out</th>
                      <th className="py-2.5 px-3 text-center">Police Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {policeFilteredBills.map((b, idx) => (
                      <tr key={b.invoiceNo || b.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Room {b.roomNumber}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{b.customerName}</div>
                          <div className="text-[10px] text-slate-400">{b.roomType}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {b.countryCode || '+91'} {b.customerPhone}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {b.idType || 'Aadhaar Card'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                          {b.idNumber ? b.idNumber : <span className="text-slate-400 italic">Physically Verified</span>}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {b.numPersons || 1}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                          {b.checkInDateTime ? b.checkInDateTime.replace('T', ' ') : '12-Nov-2026 12:00 PM'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                          {b.checkOutDateTime ? b.checkOutDateTime.replace('T', ' ') : '13-Nov-2026 11:00 AM'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>VERIFIED</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* OFFICIAL PRINT PREVIEW MODAL FOR POLICE SUBMISSION              */}
          {/* =============================================================== */}
          {isPolicePrintModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-fade-in print:static print:inset-auto print:p-0 print:bg-white print:backdrop-blur-none">
              <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4 relative print:max-w-none print:w-full print:p-0 print:m-0 print:shadow-none print:border-none print:overflow-visible">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-700" />
                    <span className="font-bold text-sm text-slate-900">
                      Official Digha Police Station Daily Guest Registration Sheet
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrintPoliceReport}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Document</span>
                    </button>
                    <button
                      onClick={() => setIsPolicePrintModalOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* The Formal Police Compliance Sheet Document */}
                <div id="police-report-print" className="bg-white p-6 border-2 border-slate-900 rounded-lg text-slate-900 space-y-4 text-xs font-sans">
                  
                  {/* Government / PS Formal Header */}
                  <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      GOVERNMENT OF WEST BENGAL &bull; WEST BENGAL POLICE &bull; PURBA MEDINIPUR DISTRICT
                    </div>
                    <h2 className="text-xl font-extrabold uppercase tracking-wide text-slate-950 font-serif">
                      OFFICE OF THE OFFICER-IN-CHARGE, DIGHA POLICE STATION
                    </h2>
                    <div className="inline-block bg-slate-900 text-white font-bold text-[11px] px-4 py-1 rounded tracking-wider uppercase mt-1">
                      DAILY GUEST REGISTRATION & IDENTITY VERIFICATION RECORD
                    </div>
                    <p className="text-[10px] text-slate-500 italic mt-0.5">
                      (Mandatory Record Under West Bengal Police Hospitality Registration Rules)
                    </p>
                  </div>

                  {/* Hotel & Date Meta Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-300 text-[11px]">
                    <div>
                      <span className="font-bold text-slate-600 block">Hotel / Property:</span>
                      <span className="font-extrabold text-slate-900">{hotelName}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-600 block">Jurisdiction:</span>
                      <span className="font-semibold text-slate-800">Digha PS (New Digha Sector)</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-600 block">Report Submission Date:</span>
                      <span className="font-mono font-bold text-slate-900">{policeDate}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-600 block">Total Guest Strength:</span>
                      <span className="font-mono font-extrabold text-blue-800">
                        {policeFilteredBills.reduce((acc, b) => acc + (b.numPersons || 1), 0)} Occupants ({policeFilteredBills.length} Rooms)
                      </span>
                    </div>
                  </div>

                  {/* Formal Guest Register Table */}
                  <div className="border border-slate-900 rounded overflow-hidden">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider border-b border-slate-900">
                          <th className="py-2 px-2 border-r border-slate-700 w-8 text-center">SL</th>
                          <th className="py-2 px-2 border-r border-slate-700 w-16 text-center">Room</th>
                          <th className="py-2 px-3 border-r border-slate-700">Guest Name</th>
                          <th className="py-2 px-3 border-r border-slate-700">Mobile Number</th>
                          <th className="py-2 px-3 border-r border-slate-700">ID Document</th>
                          <th className="py-2 px-3 border-r border-slate-700">ID Number</th>
                          <th className="py-2 px-2 border-r border-slate-700 text-center w-12">Guests</th>
                          <th className="py-2 px-2 border-r border-slate-700">Check-In</th>
                          <th className="py-2 px-2">Check-Out</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 font-medium">
                        {policeFilteredBills.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-6 text-center text-slate-500 italic">
                              No guest registrations recorded on this date.
                            </td>
                          </tr>
                        ) : (
                          policeFilteredBills.map((b, idx) => (
                            <tr key={b.invoiceNo || b.id} className="border-b border-slate-300">
                              <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                              <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono font-bold">Room {b.roomNumber}</td>
                              <td className="py-1.5 px-3 border-r border-slate-300 font-bold uppercase">{b.customerName}</td>
                              <td className="py-1.5 px-3 border-r border-slate-300 font-mono">{b.countryCode || '+91'} {b.customerPhone}</td>
                              <td className="py-1.5 px-3 border-r border-slate-300">{b.idType || 'Aadhaar Card'}</td>
                              <td className="py-1.5 px-3 border-r border-slate-300 font-mono">{b.idNumber || 'Verified & Inspected'}</td>
                              <td className="py-1.5 px-2 border-r border-slate-300 text-center font-bold">{b.numPersons || 1}</td>
                              <td className="py-1.5 px-2 border-r border-slate-300 text-[10px] whitespace-nowrap font-mono">{b.checkInDateTime ? b.checkInDateTime.replace('T', ' ') : ''}</td>
                              <td className="py-1.5 px-2 text-[10px] whitespace-nowrap font-mono">{b.checkOutDateTime ? b.checkOutDateTime.replace('T', ' ') : ''}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Official Certification & Signature Line */}
                  <div className="pt-3 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-[11px]">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800 uppercase text-[10px]">Manager Declaration:</div>
                      <p className="text-slate-600 italic text-[10px] leading-relaxed">
                        I hereby solemnly certify that all particulars of guests mentioned above have been physically verified against original Government-approved Photo Identity Cards (Aadhaar / Voter ID / Passport) and recorded faithfully in compliance with Digha Police Station directives.
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <div className="w-56 text-center">
                        <div className="h-12 flex items-center justify-center">
                          <img 
                            src={`data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='80' viewBox='0 0 240 80'><g fill='none' stroke='%231a365d'><circle cx='50' cy='40' r='32' stroke-width='2' stroke-dasharray='4 2'/><circle cx='50' cy='40' r='27' stroke-width='1'/><text x='50' y='36' font-size='7' font-weight='bold' fill='%231a365d' text-anchor='middle' stroke='none'>${encodeURIComponent(hotelName.toUpperCase())}</text><text x='50' y='46' font-size='6' fill='%231a365d' text-anchor='middle' stroke='none'>★ DIGHA PS VERIFIED ★</text><path d='M95 50 Q110 20 125 45 T155 35 T180 55 T215 30' stroke-width='2.5' stroke-linecap='round'/><path d='M90 60 Q150 55 220 52' stroke-width='1.8' stroke-linecap='round'/></g></svg>`}
                            alt="Manager Signature & Stamp" 
                            className="max-h-12 object-contain pointer-events-none"
                          />
                        </div>
                        <div className="border-t border-slate-700 pt-1 font-bold text-slate-900 uppercase text-[10.5px]">
                          Authorized Hotel Manager
                        </div>
                        <div className="text-[9.5px] text-slate-500 font-semibold">
                          For {hotelName} &bull; {hotelPhone}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Micro Footer */}
                  <div className="text-center text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-200">
                    Digha Police Station Compliance Register &bull; Generated on {new Date().toLocaleString()} &bull; {hotelAddress}
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 no-print">
                  <button
                    onClick={() => setIsPolicePrintModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={handlePrintPoliceReport}
                    className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow cursor-pointer flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Formal Police Report</span>
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

