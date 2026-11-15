import React, { useState } from 'react';
import { formatINR } from '../../utils/numberToWords';
import { 
  FileText, Search, Download, Trash2, Eye, ArrowLeft, 
  Building2, Calendar, CreditCard, Filter
} from 'lucide-react';

export default function InvoicesArchiveView({
  allBills = [],
  hotelFilter,
  setHotelFilter,
  datePreset,
  setDatePreset,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  paymentModeFilter,
  setPaymentModeFilter,
  statusFilter,
  setStatusFilter,
  onExportCSV,
  onSelectBill,
  onDeleteBill,
  onBackToDashboard
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [billTypeFilter, setBillTypeFilter] = useState('all'); // 'all', 'gst', 'non-gst'

  // Filter bills
  const filteredBills = allBills.filter(b => {
    if (hotelFilter !== 'all' && b.hotelId !== hotelFilter) return false;
    if (paymentModeFilter !== 'all' && b.paymentMode !== paymentModeFilter) return false;
    if (statusFilter !== 'all' && b.paymentStatus !== statusFilter) return false;
    if (billTypeFilter === 'gst' && b.isNonGST) return false;
    if (billTypeFilter === 'non-gst' && !b.isNonGST) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = b.customerName?.toLowerCase().includes(term);
      const matchPhone = b.customerPhone?.includes(term);
      const matchInv = b.invoiceNo?.toLowerCase().includes(term);
      const matchRoom = b.roomNumber?.toLowerCase().includes(term);
      const matchHotel = b.hotelName?.toLowerCase().includes(term);
      if (!matchName && !matchPhone && !matchInv && !matchRoom && !matchHotel) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer"
            title="Back to HQ Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 font-serif tracking-wide">
                Master Invoices Archive & Bill Ledger
              </h1>
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                {filteredBills.length} Invoices Found
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onExportCSV}
          className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer font-mono"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      {/* FILTERS & SEARCH ROW */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Property Selector */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <select
              value={hotelFilter}
              onChange={(e) => setHotelFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">🏢 All 3 Properties</option>
              <option value="hotel-1">Hotel Rojana</option>
              <option value="hotel-2">HOTEL SERENA</option>
              <option value="hotel-3">Hotel Sea Pearl</option>
            </select>
          </div>

          {/* Date Range Presets */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setDatePreset('all')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition cursor-pointer ${datePreset === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All Time
            </button>
            <button
              onClick={() => setDatePreset('today')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition cursor-pointer ${datePreset === 'today' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Today
            </button>
            <button
              onClick={() => setDatePreset('week')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition cursor-pointer ${datePreset === 'week' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDatePreset('month')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition cursor-pointer ${datePreset === 'month' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              This Month
            </button>
          </div>

          {/* Mode, Status & Bill Type Filters */}
          <div className="flex items-center gap-2">
            <select
              value={billTypeFilter}
              onChange={(e) => setBillTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Bill Types</option>
              <option value="gst">GST Tax Invoices</option>
              <option value="non-gst">Non-GST Bills</option>
            </select>

            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none"
            >
              <option value="all">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI / QR">UPI / QR</option>
              <option value="Card">Card</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none"
            >
              <option value="all">All Status</option>
              <option value="PAID">Paid in Full</option>
              <option value="DUE">Balance Due</option>
            </select>
          </div>

        </div>

        {/* Search Input */}
        <div className="relative pt-1 border-t border-slate-100">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice number, guest name, phone, room number..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-xs text-slate-900 outline-none"
          />
        </div>
      </div>

      {/* INVOICES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-500 font-sans">
                    No invoice records match this search query.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id || b._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{b.billDate}</td>
                    <td className="py-2.5 px-3 font-mono">
                      <div className="font-bold text-blue-700 flex items-center gap-1.5">
                        <span>{b.invoiceNo}</span>
                        {b.isNonGST ? (
                          <span className="text-[9px] font-sans font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            Non-GST
                          </span>
                        ) : (
                          <span className="text-[9px] font-sans font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                            GST
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{b.hotelName}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900">{b.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{b.customerPhone}</div>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-800 font-bold">{b.roomNumber}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      ₹ {formatINR(b.netTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                      ₹ {formatINR(b.balanceDue)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 text-[11px] font-mono">
                      {b.paymentMode}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        b.paymentStatus === 'PAID' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectBill(b)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Inspect Bill & Print"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteBill(b.id || b._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Delete Bill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
