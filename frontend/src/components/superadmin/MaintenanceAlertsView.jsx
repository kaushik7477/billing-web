import React, { useState } from 'react';
import { 
  Wrench, AlertTriangle, CheckCircle2, ArrowLeft, Building2, 
  Clock, User, RefreshCw, Sparkles
} from 'lucide-react';

export default function MaintenanceAlertsView({
  issues = [],
  isLoading,
  onRefresh,
  onResolveIssue,
  onBackToDashboard
}) {
  const [resolvingId, setResolvingId] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  const handleFix = async (issue) => {
    setResolvingId(issue.id || issue._id);
    try {
      const ok = await onResolveIssue(issue);
      if (ok) {
        setSuccessToast(`Issue for Room ${issue.roomNumber} (${issue.hotelName}) marked as Resolved!`);
        setTimeout(() => setSuccessToast(''), 4000);
      }
    } finally {
      setResolvingId(null);
    }
  };

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
                Room Issues & Maintenance Alerts Panel
              </h1>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                issues.length > 0 
                  ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {issues.length > 0 ? `${issues.length} Active Issues` : 'All Systems Clear'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="p-2.5 text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-xl transition flex items-center gap-2 text-xs font-mono font-bold self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Issues</span>
        </button>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ISSUES LIST */}
      {issues.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center max-w-xl mx-auto shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-slate-900 font-serif">
            Zero Active Maintenance Issues
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            All rooms, appliances, air conditioners, and guest amenities across Hotel Rojana, Hotel Sagar Priya, and Hotel Sea Pearl are in 100% operational working condition.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map((issue) => {
            const isBusy = resolvingId === (issue.id || issue._id);

            return (
              <div
                key={issue.id || issue._id}
                className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs flex flex-col justify-between hover:border-rose-400 transition group"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-rose-700 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      ACTIVE DEFECT
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      Floor {issue.floor || 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-black font-mono text-slate-900">
                      Room {issue.roomNumber}
                    </span>
                    <span className="text-xs font-mono text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                      {issue.roomType || 'Deluxe'}
                    </span>
                  </div>

                  {/* Hotel Name */}
                  <div className="text-xs font-bold text-blue-700 mt-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{issue.hotelName}</span>
                  </div>

                  {/* Issue Description Box */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Defect Description:
                    </div>
                    {issue.issue}
                  </div>

                  {/* Reporter Meta */}
                  <div className="mt-3 text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Reported By: {issue.reportedBy || 'Manager'}</span>
                    </div>
                    {issue.reportedAt && (
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Date: {new Date(issue.reportedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action: Resolve Button */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleFix(issue)}
                    disabled={isBusy}
                    className="w-full py-2 px-3 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 font-mono"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isBusy ? 'Marking Fixed...' : 'Mark as Fixed & Operational'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
