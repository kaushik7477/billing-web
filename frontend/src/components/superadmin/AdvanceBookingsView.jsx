import React, { useState } from 'react';
import { formatINR } from '../../utils/numberToWords';
import { 
  CalendarClock, Search, ArrowLeft, Building2, Phone, 
  Calendar, CheckCircle2, Clock, AlertCircle, RefreshCw
} from 'lucide-react';

export default function AdvanceBookingsView({
  bookings = [],
  hotels = [],
  isLoading,
  onRefresh,
  onBackToDashboard
}) {
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered Bookings
  const filteredBookings = bookings.filter(b => {
    if (selectedHotel !== 'all' && b.hotelId !== selectedHotel) return false;
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = b.customerName?.toLowerCase().includes(term);
      const matchPhone = b.customerPhone?.includes(term);
      const matchId = b.bookingId?.toLowerCase().includes(term);
      const matchRoom = b.roomNumber?.toLowerCase().includes(term);
      if (!matchName && !matchPhone && !matchId && !matchRoom) return false;
    }
    return true;
  });

  // Totals
  const totalUpcoming = filteredBookings.filter(b => b.status === 'RESERVED').length;
  const totalAdvance = filteredBookings.reduce((sum, b) => sum + (parseFloat(b.advancePaid) || 0), 0);

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
                Advance Bookings & Reservation Ledger
              </h1>
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                {bookings.length} Registered Bookings
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="p-2.5 text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-xl transition flex items-center gap-2 text-xs font-mono font-bold self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Bookings</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Total Reservations</span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {filteredBookings.length}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Upcoming Confirmed</span>
          <span className="text-xl sm:text-2xl font-black text-blue-700 font-mono">
            {totalUpcoming} Stays
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Total Advance Collected</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
            ₹ {formatINR(totalAdvance)}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">Checked-In Already</span>
          <span className="text-xl sm:text-2xl font-black text-blue-700 font-mono">
            {filteredBookings.filter(b => b.status === 'CHECKED_IN').length}
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        
        {/* Hotel & Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">🏢 All 3 Properties</option>
              <option value="hotel-1">Hotel Rojana</option>
              <option value="hotel-2">HOTEL SERENA</option>
              <option value="hotel-3">Hotel Sea Pearl</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition cursor-pointer ${
                statusFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('RESERVED')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition cursor-pointer ${
                statusFilter === 'RESERVED' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reserved
            </button>
            <button
              onClick={() => setStatusFilter('CHECKED_IN')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition cursor-pointer ${
                statusFilter === 'CHECKED_IN' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Checked In
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search guest, phone, booking ID..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg text-xs text-slate-900 outline-none"
          />
        </div>

      </div>

      {/* TABLE DISPLAY */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-3">Booking ID</th>
                <th className="py-3 px-3">Property</th>
                <th className="py-3 px-3">Guest Details</th>
                <th className="py-3 px-2">Room / Category</th>
                <th className="py-3 px-3">Arrival Date</th>
                <th className="py-3 px-3">Departure Date</th>
                <th className="py-3 px-3 text-right">Advance Paid</th>
                <th className="py-3 px-2 text-center">Mode</th>
                <th className="py-3 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                    No advance bookings found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.bookingId || b._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{b.bookingId}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {b.hotelName || (b.hotelId === 'hotel-1' ? 'Hotel Rojana' : b.hotelId === 'hotel-2' ? 'HOTEL SERENA' : 'Hotel Sea Pearl')}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{b.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{b.countryCode || '+91'} {b.customerPhone}</div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-700">
                      <div>{b.roomType || 'Standard'}</div>
                      {b.roomNumber && <div className="text-[10px] font-mono text-blue-700 font-semibold">Room: {b.roomNumber}</div>}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">
                      <div className="font-bold text-slate-900">{b.checkInDate}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {b.checkOutDate}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      ₹ {formatINR(b.advancePaid || 0)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-[10px] font-mono text-slate-600">
                      {b.paymentMode || 'UPI'}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        b.status === 'RESERVED' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {b.status}
                      </span>
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
