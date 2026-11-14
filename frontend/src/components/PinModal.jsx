import React, { useState } from 'react';
import { KeyRound, X, AlertCircle, Building2, Lock } from 'lucide-react';

export default function PinModal({ hotel, isOpen, onClose, onLoginSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !hotel) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setError('Please enter a 4-digit PIN.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/manager-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: hotel.hotelId, pin })
      });

      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.hotel, data.token);
      } else {
        setError(data.message || 'Invalid Manager PIN.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-sm w-full p-6 text-white shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-brand-800/80 border border-brand-500/30 flex items-center justify-center text-brand-200 shadow-lg">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold font-serif text-white">{hotel.name}</h3>
          <p className="text-xs text-amber-300 font-medium italic mt-0.5">{hotel.subText}</p>
          <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Enter Manager Access PIN</span>
          </p>
        </div>

        {/* PIN Display Circles */}
        <div className="flex items-center justify-center gap-3 my-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-brand-500 border-brand-400 scale-110 shadow-md shadow-brand-500/50'
                  : 'bg-slate-800 border-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form with NumPad */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            placeholder="••••"
            className="w-full text-center text-xl font-mono tracking-widest py-2 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-white"
            autoFocus
          />

          {/* Virtual keypad */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="py-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-200 border border-slate-700/60 active:scale-95 transition"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="py-2.5 bg-slate-800/40 hover:bg-slate-700 text-xs font-semibold text-slate-400 rounded-xl border border-slate-700/60 transition"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress(0)}
              className="py-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-200 border border-slate-700/60 active:scale-95 transition"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="py-2.5 bg-slate-800/40 hover:bg-slate-700 text-xs font-semibold text-slate-400 rounded-xl border border-slate-700/60 transition"
            >
              ⌫
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || pin.length < 4}
            className="w-full mt-3 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isLoading ? 'Verifying PIN...' : 'Authorize & Open Billing'}</span>
          </button>
        </form>

        {/* Demo PIN hint */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            Demo PIN for this hotel:{' '}
            <strong className="text-amber-400 font-mono">
              {hotel.hotelId === 'hotel-1' ? '1111' : hotel.hotelId === 'hotel-2' ? '2222' : '3333'}
            </strong>
          </p>
        </div>

      </div>
    </div>
  );
}

