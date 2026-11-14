import React, { useState } from 'react';
import { formatINR } from '../../utils/numberToWords';
import {
  Wallet, CreditCard, QrCode, DollarSign, Building2,
  ArrowLeft, Calendar, ShieldCheck, CheckCircle2, TrendingUp, Filter
} from 'lucide-react';

export default function CashAuditView({
  allBills = [],
  summary = null,
  hotelFilter,
  setHotelFilter,
  datePreset,
  setDatePreset,
  onBackToDashboard
}) {
  // Filtered bills based on hotelFilter
  const billsToAudit = allBills.filter(b => {
    if (hotelFilter !== 'all' && b.hotelId !== hotelFilter) return false;
    return true;
  });

  // Calculate payment mode breakdowns from bills
  let totalCash = 0;
  let totalUPI = 0;
  let totalCard = 0;
  let totalOther = 0;
  let totalDue = 0;

  billsToAudit.forEach(b => {
    const amount = (parseFloat(b.advancePaid) || 0) + (b.paymentStatus === 'PAID' ? (parseFloat(b.balanceDue) || 0) : 0) || (parseFloat(b.netTotal) || 0);
    const mode = (b.paymentMode || '').toUpperCase();
    if (mode.includes('CASH')) {
      totalCash += amount;
    } else if (mode.includes('UPI') || mode.includes('QR')) {
      totalUPI += amount;
    } else if (mode.includes('CARD')) {
      totalCard += amount;
    } else {
      totalOther += amount;
    }
    totalDue += (parseFloat(b.balanceDue) || 0);
  });

  const totalCollected = totalCash + totalUPI + totalCard + totalOther;
  const cashPercent = totalCollected > 0 ? Math.round((totalCash / totalCollected) * 100) : 0;
  const upiPercent = totalCollected > 0 ? Math.round((totalUPI / totalCollected) * 100) : 0;
  const cardPercent = totalCollected > 0 ? Math.max(0, 100 - cashPercent - upiPercent) : 0;

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
                Payment Mode & Physical Cash Audit
              </h1>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Audit Vault
              </span>
            </div>
          </div>
        </div>

        {/* Property Selector */}
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
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setDatePreset('all')}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition cursor-pointer ${datePreset === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            All Time
          </button>
          <button
            onClick={() => setDatePreset('today')}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition cursor-pointer ${datePreset === 'today' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Today
          </button>
          <button
            onClick={() => setDatePreset('week')}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition cursor-pointer ${datePreset === 'week' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDatePreset('month')}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition cursor-pointer ${datePreset === 'month' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            This Month
          </button>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Total Collection Audited: <span className="font-bold text-slate-900">₹ {formatINR(totalCollected)}</span>
        </div>
      </div>

      {/* 3 PRIMARY PAYMENT MODE AUDIT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Card 1: Physical Cash in Hand */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs hover:shadow-md relative overflow-hidden transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {cashPercent}% of Total
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block">
            Physical Cash In Hand
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono mt-1">
            ₹ {formatINR(totalCash)}
          </div>

        </div>

        {/* Card 2: UPI / QR Bank Credits */}
        <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs hover:shadow-md relative overflow-hidden transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-black text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
              {upiPercent}% of Total
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block">
            UPI / QR Online Collections
          </span>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 font-mono mt-1">
            ₹ {formatINR(totalUPI)}
          </div>

        </div>

        {/* Card 3: Card POS Collections */}
        <div className="bg-white border border-purple-200 rounded-2xl p-5 shadow-xs hover:shadow-md relative overflow-hidden transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-black text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
              {cardPercent}% of Total
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block">
            Card POS Machine Swipes
          </span>
          <div className="text-2xl sm:text-3xl font-black text-purple-700 font-mono mt-1">
            ₹ {formatINR(totalCard)}
          </div>

        </div>

      </div>

      {/* VISUAL PAYMENT BREAKDOWN BAR */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            Payment Mode Distribution Ratio
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Physical Cash vs Bank Transfers
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${cashPercent}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`Cash: ${cashPercent}%`}
          />
          <div
            style={{ width: `${upiPercent}%` }}
            className="bg-blue-500 h-full transition-all duration-500"
            title={`UPI: ${upiPercent}%`}
          />
          <div
            style={{ width: `${cardPercent}%` }}
            className="bg-purple-500 h-full transition-all duration-500"
            title={`Card: ${cardPercent}%`}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mt-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span className="text-slate-700 font-semibold">Cash in Hand ({cashPercent}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-500"></span>
            <span className="text-slate-700 font-semibold">UPI / QR Transfers ({upiPercent}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-purple-500"></span>
            <span className="text-slate-700 font-semibold">Card Swipes ({cardPercent}%)</span>
          </div>
        </div>
      </div>

      {/* AUDIT TRANSACTION LOG TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
            Recent Payment Mode Audit Records ({billsToAudit.length})
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            Real-time Invoices
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Invoice No</th>
                <th className="py-3 px-3">Hotel Property</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-2 font-mono">Room</th>
                <th className="py-3 px-3">Payment Mode</th>
                <th className="py-3 px-3 text-right">Settled Amount</th>
                <th className="py-3 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {billsToAudit.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No transactions recorded for this audit period.
                  </td>
                </tr>
              ) : (
                billsToAudit.slice(0, 20).map((b) => {
                  const mode = (b.paymentMode || '').toUpperCase();
                  let modeBadge = 'bg-slate-100 text-slate-700';
                  if (mode.includes('CASH')) modeBadge = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                  else if (mode.includes('UPI') || mode.includes('QR')) modeBadge = 'bg-blue-100 text-blue-800 border border-blue-200';
                  else if (mode.includes('CARD')) modeBadge = 'bg-purple-100 text-purple-800 border border-purple-200';

                  return (
                    <tr key={b.id || b._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 text-slate-500 font-sans">{b.billDate}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-700">{b.invoiceNo}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{b.hotelName}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800">{b.customerName}</td>
                      <td className="py-2.5 px-2 text-slate-900 font-bold">{b.roomNumber}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${modeBadge}`}>
                          {b.paymentMode || 'Cash'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ₹ {formatINR(b.netTotal)}
                      </td>
                      <td className="py-2.5 px-2 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                          {b.paymentStatus}
                        </span>
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
