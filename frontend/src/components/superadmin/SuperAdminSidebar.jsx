import React from 'react';
import {
  LayoutDashboard, BedDouble, Users, Wallet, BarChart3,
  CalendarClock, Wrench, KeyRound, Settings, FileText,
  LogOut, ShieldCheck, X, RefreshCw, Download
} from 'lucide-react';

export default function SuperAdminSidebar({
  activeNav,
  setActiveNav,
  isMobileOpen,
  setIsMobileOpen,
  onLogout,
  onExportCSV,
  onRefresh,
  isLoading,
  issuesCount = 0,
  inHouseCount = 0
}) {
  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard, badge: null },
    { id: 'rooms', label: 'ROOM STATUS', icon: BedDouble, badge: null },
    { id: 'guests', label: 'GUEST LIST & DUES', icon: Users, badge: inHouseCount > 0 ? inHouseCount : null },
    { id: 'cashAudit', label: 'CASH AUDIT', icon: Wallet, badge: null },
    { id: 'analytics', label: 'REVENUE & OCCUPANCY', icon: BarChart3, badge: null },
    { id: 'advance', label: 'ADVANCE BOOKINGS', icon: CalendarClock, badge: null },
    { id: 'maintenance', label: 'ROOM ISSUES', icon: Wrench, badge: issuesCount > 0 ? issuesCount : null, alert: issuesCount > 0 },
    { id: 'managers', label: 'MANAGER ACCESS', icon: KeyRound, badge: null },
    { id: 'tariffs', label: 'ROOMS & TARIFFS', icon: Settings, badge: null },
    { id: 'invoices', label: 'INVOICES ARCHIVE', icon: FileText, badge: null },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between shadow-xs
        transition-transform duration-300 ease-in-out no-print print:hidden
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Branding Section */}
        <div>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/25">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-black tracking-wider text-slate-950 font-mono uppercase">
                  Admin PANEL
                </div>
                <div className="text-[10px] font-mono tracking-widest text-blue-600 uppercase font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                  ROOT ACCESS
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-950 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wider transition-all cursor-pointer group
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-950 hover:text-blue-600 hover:bg-blue-50/80 border border-transparent font-bold'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition ${isActive ? 'text-white' : 'text-slate-700 group-hover:text-blue-600'}`} />
                    <span className={isActive ? 'text-white' : 'text-slate-950 group-hover:text-blue-600'}>
                      {item.label}
                    </span>
                  </div>

                  {item.badge !== null && (
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${item.alert
                      ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                      : isActive
                        ? 'bg-white text-blue-700'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions Section */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onExportCSV}
              className="flex-1 px-3 py-2 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer font-mono"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onRefresh}
              className="p-2 text-slate-700 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl transition cursor-pointer shadow-2xs"
              title="Refresh All Real-time Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full px-3 py-2 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer font-mono"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
