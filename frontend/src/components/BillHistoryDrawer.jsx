import React, { useState, useEffect } from 'react';
import { X, Search, Printer, Share2, Eye, Calendar, User, FileText } from 'lucide-react';
import { formatINR } from '../utils/numberToWords';

export default function BillHistoryDrawer({ hotel, isOpen, onClose, onSelectBill }) {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && hotel) {
      setLoading(true);
      fetch(`/api/bills?hotelId=${hotel.hotelId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setBills(data.bills);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, hotel]);

  if (!isOpen) return null;

  const filtered = bills.filter(b => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      b.customerName?.toLowerCase().includes(term) ||
      b.invoiceNo?.toLowerCase().includes(term) ||
      b.customerPhone?.includes(term) ||
      b.roomNumber?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end animate-fade-in no-print">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between text-slate-800">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-700" />
              <span>Saved Bill Records ({hotel.name})</span>
            </h3>
            <p className="text-[11px] text-slate-500">Stored in database for quick search & reprint</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by guest, phone, room, or bill no..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Records List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading records...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No saved invoices found.</div>
          ) : (
            filtered.map((b) => (
              <div
                key={b.id || b._id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 hover:border-brand-300 transition shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-brand-900">{b.invoiceNo}</span>
                  <span className="text-[11px] text-slate-500">{b.billDate}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{b.customerName}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">{b.customerPhone} &bull; Room {b.roomNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 block font-mono">₹ {formatINR(b.netTotal)}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      b.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {b.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">{b.roomType} &bull; {b.numDays} Days</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectBill(b)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded border border-brand-200 transition flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Load in View</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
