import React, { useState } from 'react';
import { formatINR } from '../../utils/numberToWords';
import { 
  BarChart3, TrendingUp, Calendar, DollarSign, Download, 
  ArrowLeft, Building2, Filter, Sparkles
} from 'lucide-react';

export default function RevenueAnalyticsView({
  hotels = [],
  activityOverview = {},
  summary = null,
  dayByDayData = [],
  weeklyData = [],
  monthlyData = [],
  hotelFilter,
  setHotelFilter,
  datePreset,
  setDatePreset,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onExportCSV,
  onBackToDashboard
}) {
  const [activeReportTab, setActiveReportTab] = useState('dayByDay'); // 'dayByDay', 'weekly', 'monthly'

  // Calculate comparative revenue & occupancy metrics for the 3 hotels
  const propertyMetrics = hotels.map(h => {
    const act = activityOverview[h.hotelId] || {};
    const totalRooms = act.totalRooms || 1;
    const occupied = act.occupiedCount || 0;
    const occupancyRate = Math.round((occupied / totalRooms) * 100);
    const rev = act.todayRevenue || 0;
    const checkIns = act.todayCheckInsCount || 0;

    return {
      hotelId: h.hotelId,
      name: h.name,
      revenue: rev,
      checkIns,
      totalRooms,
      occupied,
      occupancyRate
    };
  });

  const maxRevenue = Math.max(...propertyMetrics.map(p => p.revenue), 1000);

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
                Visual Revenue Analytics & Property Comparison
              </h1>
              <span className="text-[10px] font-mono font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                Multi-Property Benchmarks
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

      {/* ======================================================== */}
      {/* COMPARATIVE VISUAL CHARTS (HOTEL 1 vs HOTEL 2 vs HOTEL 3)*/}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Chart 1: Revenue Comparison Bar Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Today Revenue Comparison (₹)</span>
              </h2>
              <p className="text-[11px] text-slate-500">Comparative revenue generated across the 3 hotel properties</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {propertyMetrics.map((p, idx) => {
              const barWidth = Math.max(8, Math.min(100, Math.round((p.revenue / maxRevenue) * 100)));
              const colors = [
                'from-blue-600 to-blue-500',
                'from-sky-500 to-sky-400',
                'from-indigo-600 to-indigo-500'
              ];
              const colorClass = colors[idx % 3];

              return (
                <div key={p.hotelId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-900 font-sans">{p.name}</span>
                    <span className="font-black text-slate-900">₹ {formatINR(p.revenue)}</span>
                  </div>
                  
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div
                      style={{ width: `${barWidth}%` }}
                      className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{p.checkIns} check-in(s) today</span>
                    <span>{barWidth}% of highest property</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Occupancy Rate Comparison */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Live Occupancy Rates (%)</span>
              </h2>
              <p className="text-[11px] text-slate-500">Percentage of rooms occupied right now in each hotel</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {propertyMetrics.map((p, idx) => {
              const rate = p.occupancyRate;
              const barColor = rate > 70 ? 'from-rose-500 to-red-600' : rate > 30 ? 'from-blue-500 to-blue-600' : 'from-emerald-400 to-teal-500';

              return (
                <div key={p.hotelId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-900 font-sans">{p.name}</span>
                    <span className="font-black text-slate-900">{rate}% Occupied</span>
                  </div>

                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <div
                      style={{ width: `${Math.max(5, rate)}%` }}
                      className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{p.occupied} of {p.totalRooms} rooms booked</span>
                    <span>{p.totalRooms - p.occupied} rooms available</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* FILTER & PERIOD SELECTOR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Property Dropdown */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <select
              value={hotelFilter}
              onChange={(e) => setHotelFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">🏢 All 3 Properties (Consolidated)</option>
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
            <button
              onClick={() => setDatePreset('custom')}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition cursor-pointer ${datePreset === 'custom' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Custom Range
            </button>
          </div>

        </div>

        {/* Custom Date Pickers */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs font-mono">
            <span className="text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800"
            />
            <span className="text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800"
            />
          </div>
        )}
      </div>

      {/* FINANCIAL REPORT TABLES: DAY-BY-DAY, WEEKLY, MONTHLY */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveReportTab('dayByDay')}
              className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeReportTab === 'dayByDay' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Day-by-Day Financials</span>
            </button>

            <button
              onClick={() => setActiveReportTab('weekly')}
              className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeReportTab === 'weekly' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Weekly Summary</span>
            </button>

            <button
              onClick={() => setActiveReportTab('monthly')}
              className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeReportTab === 'monthly' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Monthly Summary</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {/* Day By Day */}
          {activeReportTab === 'dayByDay' && (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3 text-center">Bills</th>
                  <th className="py-3 px-3 text-right">Gross Revenue (₹)</th>
                  <th className="py-3 px-3 text-right">Advance Received (₹)</th>
                  <th className="py-3 px-3 text-right">Balance Due (₹)</th>
                  <th className="py-3 px-3 text-right">GST (5%) (₹)</th>
                  <th className="py-3 px-3 text-center">Guests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {dayByDayData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                      No records found for this timeframe.
                    </td>
                  </tr>
                ) : (
                  dayByDayData.map(row => (
                    <tr key={row.dateKey} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-sans font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>{row.dateLabel}</span>
                      </td>
                      <td className="py-3 px-3 text-center text-indigo-700 font-bold">{row.billsCount}</td>
                      <td className="py-3 px-3 text-right text-blue-700 font-bold">{formatINR(row.revenue)}</td>
                      <td className="py-3 px-3 text-right text-emerald-700 font-semibold">{formatINR(row.advance)}</td>
                      <td className="py-3 px-3 text-right text-rose-600 font-semibold">{formatINR(row.balanceDue)}</td>
                      <td className="py-3 px-3 text-right text-blue-700">{formatINR(row.gst)}</td>
                      <td className="py-3 px-3 text-center font-sans text-slate-700">{row.guests}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Weekly */}
          {activeReportTab === 'weekly' && (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Week Period</th>
                  <th className="py-3 px-3 text-center">Bills</th>
                  <th className="py-3 px-3 text-right">Gross Revenue (₹)</th>
                  <th className="py-3 px-3 text-right">Advance Received (₹)</th>
                  <th className="py-3 px-3 text-right">Balance Due (₹)</th>
                  <th className="py-3 px-3 text-right">GST (5%) (₹)</th>
                  <th className="py-3 px-3 text-center">Guests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {weeklyData.map(row => (
                  <tr key={row.weekKey} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">{row.weekLabel}</td>
                    <td className="py-3 px-3 text-center text-purple-700 font-bold">{row.billsCount}</td>
                    <td className="py-3 px-3 text-right text-slate-900 font-bold">{formatINR(row.revenue)}</td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-semibold">{formatINR(row.advance)}</td>
                    <td className="py-3 px-3 text-right text-rose-600 font-semibold">{formatINR(row.balanceDue)}</td>
                    <td className="py-3 px-3 text-right text-blue-700">{formatINR(row.gst)}</td>
                    <td className="py-3 px-3 text-center font-sans text-slate-700">{row.guests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Monthly */}
          {activeReportTab === 'monthly' && (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-3 text-center">Bills Count</th>
                  <th className="py-3 px-3 text-right">Monthly Revenue (₹)</th>
                  <th className="py-3 px-3 text-right">Advance (₹)</th>
                  <th className="py-3 px-3 text-right">Balance Due (₹)</th>
                  <th className="py-3 px-3 text-right">GST Collected (₹)</th>
                  <th className="py-3 px-3 text-center">Guests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {monthlyData.map(row => (
                  <tr key={row.monthKey} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900 text-sm">{row.monthLabel}</td>
                    <td className="py-3 px-3 text-center text-purple-700 font-bold">{row.billsCount}</td>
                    <td className="py-3 px-3 text-right text-slate-900 font-bold text-sm">{formatINR(row.revenue)}</td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-semibold">{formatINR(row.advance)}</td>
                    <td className="py-3 px-3 text-right text-rose-600 font-semibold">{formatINR(row.balanceDue)}</td>
                    <td className="py-3 px-3 text-right text-blue-700">{formatINR(row.gst)}</td>
                    <td className="py-3 px-3 text-center font-sans text-slate-700">{row.guests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
