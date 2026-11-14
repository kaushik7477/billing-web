import React from 'react';
import { formatINR } from '../../utils/numberToWords';
import {
  Building2, BedDouble, Users, Wallet, BarChart3,
  CalendarClock, Wrench, KeyRound, Settings, FileText,
  ArrowRight, Sparkles
} from 'lucide-react';

export default function DashboardLauncher({
  hotels = [],
  activityOverview = {},
  summary = null,
  onOpenNav,
  issuesCount = 0,
  inHouseCount = 0
}) {
  const appTiles = [
    {
      id: 'rooms',
      title: 'Live Room Matrix',
      icon: BedDouble,
    },
    {
      id: 'guests',
      title: 'In-House Guests & Dues',
      icon: Users,
    },
    {
      id: 'cashAudit',
      title: 'Payment Mode & Cash Audit',
      icon: Wallet,
    },
    {
      id: 'analytics',
      title: 'Visual Revenue Analytics',
      icon: BarChart3,
    },
    {
      id: 'advance',
      title: 'Advance Bookings Overview',
      icon: CalendarClock,
    },
    {
      id: 'maintenance',
      title: 'Room Issues & Maintenance',
      icon: Wrench,
    },
    {
      id: 'managers',
      title: 'Manager Access Control',
      icon: KeyRound,
    },
    {
      id: 'tariffs',
      title: 'Rooms & Tariff Config',
      icon: Settings,
    },
    {
      id: 'invoices',
      title: 'Invoices & Master Bills',
      icon: FileText,
    }
  ];

  return (
    <div className="space-y-6">

      {/* ======================================================== */}
      {/* WELCOME BACK - ROYAL BLUE ANIMATED BANNER                */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-6 sm:p-7 shadow-lg shadow-blue-500/15 border border-blue-500/30">

        {/* Animated Background Glow Blobs */}
        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
        <div className="absolute left-1/3 -top-10 w-44 h-44 bg-blue-300/15 rounded-full blur-xl pointer-events-none animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            {/* Live Synchronized Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/15 backdrop-blur-md text-white border border-white/20 mb-2.5 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="tracking-wider">CENTRAL SUPER ADMIN HQ • ALL SYSTEMS LIVE</span>
            </div>

            {/* Welcome Back Animated Heading */}
            <h1 className="text-2xl sm:text-3xl font-black text-white font-serif tracking-wide flex items-center gap-2.5">
              <span>Welcome Back, Super Admin</span>
              <span className="inline-block animate-bounce text-2xl sm:text-3xl origin-bottom-right">
                👋
              </span>
            </h1>

            {/* <p className="text-xs sm:text-sm text-blue-100 font-medium mt-1.5 max-w-xl leading-relaxed">
              Real-time property operations active across Hotel Rojana, HOTEL SERENA & Hotel Sea Pearl.
            </p> */}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onOpenNav('cashAudit')}
              className="px-4 py-2.5 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-xl shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer font-mono hover:scale-105 active:scale-95"
            >
              <Wallet className="w-4 h-4 text-blue-600" />
              <span>Audit Cash In Hand</span>
            </button>
            <button
              onClick={() => onOpenNav('rooms')}
              className="px-4 py-2.5 text-xs font-bold text-white bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-md rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer font-mono hover:scale-105 active:scale-95 shadow-xs"
            >
              <BedDouble className="w-4 h-4 text-white" />
              <span>Live Room Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: 3 HOTEL CARDS LIVE METRICS                    */}
      {/* ======================================================== */}
      <div>
        <div className="mb-3 px-1">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Hotel Properties & Live Occupancy Metrics</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {hotels.map((hotel, index) => {
            const hId = hotel.hotelId;
            const liveData = activityOverview[hId] || {};
            const total = liveData.totalRooms || 0;
            const available = liveData.availableCount || 0;
            const occupied = liveData.occupiedCount || 0;
            const reserved = liveData.reservedCount || 0;
            const cleaning = liveData.maintenanceCount || 0;
            const todayRev = liveData.todayRevenue || 0;
            const todayBills = liveData.todayCheckInsCount || 0;

            const isBlue = index === 0;
            const isGreen = index === 1;
            const borderCol = isBlue ? 'border-blue-200 hover:border-blue-400' : isGreen ? 'border-emerald-200 hover:border-emerald-400' : 'border-indigo-200 hover:border-indigo-400';

            return (
              <div
                key={hotel.hotelId}
                className={`bg-white rounded-2xl p-5 border ${borderCol} shadow-xs hover:shadow-md flex flex-col justify-between transition group`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                      Property #{index + 1}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      ONLINE SYNCED
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 font-serif tracking-wide">{hotel.name}</h3>

                  {/* LIVE ROOM STATUS BADGES */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium font-mono text-[11px]">Room Availability Status:</span>
                      <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {total} Total Rooms
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {/* Available */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg py-1.5 px-1">
                        <div className="text-base font-black font-mono text-emerald-700">{available}</div>
                        <div className="text-[9px] font-bold text-emerald-700 uppercase">Available</div>
                      </div>

                      {/* Occupied */}
                      <div className="bg-rose-50 border border-rose-200 rounded-lg py-1.5 px-1">
                        <div className="text-base font-black font-mono text-rose-700">{occupied}</div>
                        <div className="text-[9px] font-bold text-rose-700 uppercase">Occupied</div>
                      </div>

                      {/* Reserved */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg py-1.5 px-1">
                        <div className="text-base font-black font-mono text-blue-700">{reserved}</div>
                        <div className="text-[9px] font-bold text-blue-700 uppercase">Reserved</div>
                      </div>

                      {/* Cleaning */}
                      <div className="bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-1">
                        <div className="text-base font-black font-mono text-slate-700">{cleaning}</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Cleaning</div>
                      </div>
                    </div>
                  </div>

                  {/* TODAY'S COLLECTION FOR THIS HOTEL */}
                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-50/70 via-white to-emerald-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-600 uppercase block">Today's Revenue</span>
                      <span className="text-lg font-black text-blue-700 font-mono">
                        ₹ {formatINR(todayRev)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-600 block">Today Check-ins</span>
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {todayBills} Bills
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onOpenNav('rooms')}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer font-mono shadow-xs"
                  >
                    <BedDouble className="w-3.5 h-3.5 text-white" />
                    <span>View Room Matrix</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: CONSOLIDATED KPI SUMMARY ROW                  */}
      {/* ======================================================== */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Gross Revenue</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              ₹ {formatINR(summary.totalRevenue)}
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Advance Received</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
              ₹ {formatINR(summary.totalAdvance)}
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Pending Balance</span>
            <span className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
              ₹ {formatINR(summary.totalBalanceDue)}
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Total GST (5%)</span>
            <span className="text-xl sm:text-2xl font-black text-blue-600 font-mono">
              ₹ {formatINR(summary.totalGst)}
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Total Invoices</span>
            <span className="text-xl sm:text-2xl font-black text-indigo-700 font-mono">
              {summary.totalBills}
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Guests Hosted</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 font-mono">
              {summary.totalGuests}
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: APP LAUNCHER BOXES (CLEAN TILES)              */}
      {/* ======================================================== */}
      <div>
        <div className="mb-3 px-1">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Dedicated Operations Modules</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {appTiles.map((tile) => {
            const Icon = tile.icon;

            return (
              <button
                key={tile.id}
                onClick={() => onOpenNav(tile.id)}
                className="bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-400 rounded-2xl p-4 sm:p-5 text-left transition-all duration-200 hover:shadow-md group flex items-center gap-4 cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-700 transition truncate">
                    {tile.title}
                  </h3>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
