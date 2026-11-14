import React, { useState } from 'react';
import { formatINR } from '../../utils/numberToWords';
import { 
  Users, Search, ArrowLeft, Building2, Phone, Calendar, 
  CreditCard, Eye, AlertCircle, CheckCircle2, Download, Filter
} from 'lucide-react';

export default function InHouseGuestsView({
  allBills = [],
  onSelectBill,
  onBackToDashboard
}) {
  const [hotelFilter, setHotelFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Currently checked-in bills: billStatus === 'SAVED'
  const inHouseBills = allBills.filter(b => b.billStatus === 'SAVED');

  const filteredBills = inHouseBills.filter(b => {
    if (hotelFilter !== 'all' && b.hotelId !== hotelFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = b.customerName?.toLowerCase().includes(term);
      const matchPhone = b.customerPhone?.includes(term);
      const matchRoom = b.roomNumber?.toLowerCase().includes(term);
      const matchInv = b.invoiceNo?.toLowerCase().includes(term);
      const matchId = b.idNumber?.toLowerCase().includes(term);
      if (!matchName && !matchPhone && !matchRoom && !matchInv && !matchId) return false;
    }
    return true;
  });

  // Calculate totals
  let totalBillSum = 0;
  let totalAdvanceSum = 0;
  let totalDueSum = 0;
  filteredBills.forEach(b => {
    totalBillSum += (parseFloat(b.netTotal) || 0);
    totalAdvanceSum += (parseFloat(b.advancePaid) || 0);
    totalDueSum += (parseFloat(b.balanceDue) || 0);
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
                In-House Guests & Pending Balance Dues
              </h1>
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                {inHouseBills.length} Active Stays
              </span>
            </div>
          </div>
        </div>

        {/* Quick Filter */}
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
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">In-House Guests</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {filteredBills.length} Guests
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Total Stay Value</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            ₹ {formatINR(totalBillSum)}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Advance Received</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
            ₹ {formatINR(totalAdvanceSum)}
          </span>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/30 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-700 block mb-1">Pending Balance Due</span>
          <span className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
            ₹ {formatINR(totalDueSum)}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by guest name, phone, room number, invoice number, or ID card..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg text-xs text-slate-900 outline-none"
          />
        </div>
        <div className="text-xs font-mono text-slate-500 hidden sm:block">
          Showing {filteredBills.length} guest records
        </div>
      </div>

      {/* IN-HOUSE GUESTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-3">Property</th>
                <th className="py-3 px-2 font-mono">Room(s)</th>
                <th className="py-3 px-3">Guest Details</th>
                <th className="py-3 px-3">ID Proof</th>
                <th className="py-3 px-3">Stay Duration</th>
                <th className="py-3 px-3 text-right">Total Bill</th>
                <th className="py-3 px-3 text-right">Advance Paid</th>
                <th className="py-3 px-3 text-right">Balance Due</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-500 font-sans">
                    No active in-house guests found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => {
                  const hasDue = (parseFloat(b.balanceDue) || 0) > 0;

                  return (
                    <tr key={b.id || b._id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Property */}
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span>{b.hotelName}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">{b.invoiceNo}</div>
                      </td>

                      {/* Room */}
                      <td className="py-3 px-2 font-mono font-bold text-slate-900">
                        <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {b.roomNumber}
                        </span>
                      </td>

                      {/* Guest Details */}
                      <td className="py-3 px-3 text-slate-800">
                        <div className="font-bold text-slate-900">{b.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{b.countryCode || '+91'} {b.customerPhone}</span>
                        </div>
                      </td>

                      {/* ID Proof */}
                      <td className="py-3 px-3 text-slate-700">
                        <div className="text-[11px] font-medium">{b.idType || 'Aadhaar Card'}</div>
                        <div className="text-[10px] font-mono text-blue-700 font-semibold">{b.idNumber || 'N/A'}</div>
                      </td>

                      {/* Stay Duration */}
                      <td className="py-3 px-3 text-slate-700">
                        <div className="text-[11px] font-mono font-medium">
                          {b.checkInDate || String(b.checkInDateTime || '').slice(0, 10)} → {b.checkOutDate || String(b.checkOutDateTime || '').slice(0, 10)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {b.numDays || 1} Night(s) • {b.numPersons || 2} Persons
                        </div>
                      </td>

                      {/* Total Bill */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹ {formatINR(b.netTotal)}
                      </td>

                      {/* Advance Paid */}
                      <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                        ₹ {formatINR(b.advancePaid)}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={hasDue ? 'text-rose-600 font-black' : 'text-emerald-700'}>
                          ₹ {formatINR(b.balanceDue)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          hasDue 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {hasDue ? 'DUE' : 'SETTLED'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onSelectBill(b)}
                          className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
                          title="Inspect Bill & Invoice"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Bill</span>
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
