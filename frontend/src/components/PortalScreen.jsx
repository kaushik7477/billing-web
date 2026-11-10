import React from 'react';
import { Building2, ShieldCheck, MapPin, Phone, FileText, ArrowRight, KeyRound, Sparkles, BedDouble } from 'lucide-react';

export default function PortalScreen({ hotels, onSelectHotel, onOpenAdminLogin }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      
      {/* Top Banner */}
      <header className="max-w-7xl mx-auto w-full pt-4 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-brand-200 mb-4 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Multi-Property Hospitality & Central Billing Suite</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif uppercase text-white drop-shadow-md">
          Hotel Management Portal
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal">
          Select your assigned hotel property to access manager billing, or authenticate as Super Admin to view group-wide financial analytics & configure PINs.
        </p>
      </header>

      {/* Main Grid: 3 Hotel Boxes + 1 Super Admin Login Box */}
      <main className="max-w-7xl mx-auto w-full flex-1 flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full py-4">
          
          {/* Render Hotel Cards */}
          {hotels.map((hotel, index) => {
            const isBlue = index === 0;
            const isGreen = index === 1;
            const isIndigo = index === 2;

            const accentBorder = isBlue ? 'hover:border-blue-400' : isGreen ? 'hover:border-emerald-400' : 'hover:border-indigo-400';
            const badgeBg = isBlue ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' : isGreen ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30';
            const btnBg = isBlue ? 'bg-blue-600 hover:bg-blue-500' : isGreen ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500';

            return (
              <div
                key={hotel.hotelId}
                onClick={() => onSelectHotel(hotel)}
                className={`group relative bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border-2 border-slate-700/80 ${accentBorder} shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between overflow-hidden`}
              >
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all pointer-events-none"></div>

                <div>
                  {/* Top Bar with Property Index and Status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeBg}`}>
                      Hotel Box {index + 1}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Active
                    </span>
                  </div>

                  {/* Hotel Branding */}
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-4 text-white shadow-md group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6 text-brand-200" />
                  </div>

                  <h3 className="text-xl font-bold font-serif text-white group-hover:text-brand-200 transition-colors">
                    {hotel.name}
                  </h3>
                  <p className="text-xs text-amber-300/90 font-medium italic mt-0.5">
                    {hotel.subText}
                  </p>

                  {/* Property Meta Details */}
                  <div className="mt-4 pt-4 border-t border-slate-700/60 space-y-2 text-xs text-slate-300">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{hotel.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-mono">{hotel.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-mono text-[11px] text-slate-400">GSTIN: {hotel.gstin}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-brand-300">
                      <BedDouble className="w-3.5 h-3.5" />
                      <span>{hotel.roomTypes?.length || 4} Room Categories</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="mt-6 pt-4 border-t border-slate-700/60">
                  <button
                    type="button"
                    className={`w-full py-2.5 px-4 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${btnBg}`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Manager Login & Bill</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    Requires 4-Digit Manager PIN
                  </p>
                </div>
              </div>
            );
          })}

          {/* ========================================================= */}
          {/* 4TH CARD: SUPER ADMIN LOGIN BOX                           */}
          {/* ========================================================= */}
          <div
            onClick={onOpenAdminLogin}
            className="group relative bg-gradient-to-b from-amber-950/40 via-slate-800/90 to-slate-900 rounded-2xl p-6 border-2 border-amber-500/50 hover:border-amber-400 shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            {/* Ambient Gold Glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div>
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Super Admin
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold">
                  HQ Control
                </span>
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mb-4 text-amber-300 shadow-lg group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-bold font-serif text-white group-hover:text-amber-300 transition-colors">
                Super Admin Portal
              </h3>
              <p className="text-xs text-amber-200/90 font-medium italic mt-0.5">
                Central Financial Analytics & Control
              </p>

              {/* Admin Capabilities List */}
              <div className="mt-4 pt-4 border-t border-amber-500/30 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Day-by-Day Financial Reports</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Weekly & Monthly Revenue Stats</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Set & Reset 3 Hotel Manager PINs</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Export Reports to CSV (Excel)</span>
                </div>
              </div>
            </div>

            {/* Admin Action Button */}
            <div className="mt-6 pt-4 border-t border-amber-500/30">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl text-slate-900 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-slate-900" />
                <span>Super Admin Sign In</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-900 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-[10px] text-center text-amber-300/70 mt-2">
                Default: admin / admin123
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center py-4 text-xs text-slate-400 border-t border-slate-800 mt-6">
        Hotel Multi-Property Cloud Billing Platform &bull; Designed for West Bengal & Coastal Hospitality Operators &bull; v2.0 MERN
      </footer>

    </div>
  );
}
