import React, { useState } from 'react';
import { 
  KeyRound, ShieldCheck, User, Lock, Eye, EyeOff, 
  Edit3, CheckCircle2, ArrowLeft, Building2, Hash, AlertCircle
} from 'lucide-react';

export default function ManagerAccessView({
  hotels = [],
  token,
  onHotelsUpdated,
  onBackToDashboard
}) {
  const [editingCredHotel, setEditingCredHotel] = useState(null);
  const [newUsernameValue, setNewUsernameValue] = useState('');
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [isUpdatingCred, setIsUpdatingCred] = useState(false);
  const [credChangeMsg, setCredChangeMsg] = useState('');

  // PIN Editing State
  const [editingPinHotel, setEditingPinHotel] = useState(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  const togglePasswordVisibility = (hotelId) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [hotelId]: !prev[hotelId]
    }));
  };

  // Save Credentials (Username & Password)
  const handleSaveCredentials = async (hotelId) => {
    if (!newUsernameValue || newUsernameValue.trim().length < 3) {
      alert('Manager User ID must be at least 3 characters.');
      return;
    }
    if (!newPasswordValue || newPasswordValue.trim().length < 4) {
      alert('Manager Password must be at least 4 characters.');
      return;
    }

    setIsUpdatingCred(true);
    try {
      const res = await fetch(`/api/hotels/${hotelId}/credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          managerUsername: newUsernameValue.trim(),
          managerPassword: newPasswordValue.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setCredChangeMsg(data.message);
        setEditingCredHotel(null);
        setNewUsernameValue('');
        setNewPasswordValue('');
        onHotelsUpdated();
        setTimeout(() => setCredChangeMsg(''), 4500);
      } else {
        alert(data.message || 'Failed to update credentials.');
      }
    } catch (err) {
      alert('Network error updating credentials.');
    } finally {
      setIsUpdatingCred(false);
    }
  };

  // Save 4-Digit Security PIN
  const handleSavePin = async (hotelId) => {
    if (!newPinValue || newPinValue.trim().length < 4) {
      alert('Security PIN must be at least 4 digits.');
      return;
    }

    setIsUpdatingPin(true);
    try {
      const res = await fetch(`/api/hotels/${hotelId}/pin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newPin: newPinValue.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setCredChangeMsg(data.message);
        setEditingPinHotel(null);
        setNewPinValue('');
        onHotelsUpdated();
        setTimeout(() => setCredChangeMsg(''), 4500);
      } else {
        alert(data.message || 'Failed to update PIN.');
      }
    } catch (err) {
      alert('Network error updating PIN.');
    } finally {
      setIsUpdatingPin(false);
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
                Admin Access Control & Manager Credentials
              </h1>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                SUPERADMIN ONLY PANEL
              </span>
            </div>
          </div>
        </div>

        <span className="text-xs font-mono text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl self-start sm:self-auto font-bold">
          {hotels.length} Properties Enrolled
        </span>
      </div>

      {/* Success Notification Bar */}
      {credChangeMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{credChangeMsg}</span>
        </div>
      )}

      {/* 3 HOTEL CREDENTIALS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {hotels.map((hotel, index) => {
          const isEditingCred = editingCredHotel === hotel.hotelId;
          const isEditingPin = editingPinHotel === hotel.hotelId;

          const isBlue = index === 0;
          const isGreen = index === 1;
          const borderCol = isBlue ? 'border-blue-200' : isGreen ? 'border-emerald-200' : 'border-indigo-200';

          return (
            <div
              key={hotel.hotelId}
              className={`bg-white rounded-2xl p-5 border ${borderCol} shadow-xs hover:shadow-md flex flex-col justify-between transition`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    Hotel Account #{index + 1}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ACTIVE
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 font-serif">{hotel.name}</h3>
                <p className="text-xs text-blue-700 italic">{hotel.subText}</p>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{hotel.address}</p>

                {/* Current User ID & Password Box */}
                <div className="mt-4 space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  
                  {/* User ID */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5 font-mono text-[11px]">
                      <User className="w-3.5 h-3.5 text-blue-600" /> Manager User ID:
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {hotel.managerUsername || 'Not set'}
                    </span>
                  </div>

                  {/* Password */}
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5 font-mono text-[11px]">
                      <Lock className="w-3.5 h-3.5 text-slate-500" /> Password:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {showPasswordMap[hotel.hotelId] ? hotel.managerPassword : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(hotel.hotelId)}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Show/Hide password"
                      >
                        {showPasswordMap[hotel.hotelId] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Security PIN */}
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5 font-mono text-[11px]">
                      <Hash className="w-3.5 h-3.5 text-emerald-600" /> Security PIN:
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {hotel.managerPin || '1234'}
                    </span>
                  </div>

                </div>
              </div>

              {/* Form Controls / Modals */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                
                {/* 1. Edit Credentials Form */}
                {isEditingCred ? (
                  <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-blue-200">
                    <div className="text-[11px] font-bold text-slate-900 flex items-center justify-between">
                      <span>Update Login Credentials:</span>
                      <span className="text-[10px] text-blue-700 font-mono font-semibold">Saves to MongoDB Atlas</span>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono font-semibold text-slate-500 block mb-1">
                        Manager User ID:
                      </label>
                      <input
                        type="text"
                        value={newUsernameValue}
                        onChange={(e) => setNewUsernameValue(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        placeholder="e.g. hotel1 or rojana_mgr"
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 focus:border-blue-500 rounded-lg text-slate-900 outline-none"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono font-semibold text-slate-500 block mb-1">
                        Manager Password:
                      </label>
                      <input
                        type="text"
                        value={newPasswordValue}
                        onChange={(e) => setNewPasswordValue(e.target.value)}
                        placeholder="e.g. pass1234"
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 focus:border-blue-500 rounded-lg text-slate-900 outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveCredentials(hotel.hotelId)}
                        disabled={isUpdatingCred || newUsernameValue.length < 3 || newPasswordValue.length < 4}
                        className="flex-1 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50 cursor-pointer font-mono"
                      >
                        {isUpdatingCred ? 'Saving...' : 'Save to Atlas'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingCredHotel(null); setNewUsernameValue(''); setNewPasswordValue(''); }}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* 2. Edit PIN Form */}
                {isEditingPin ? (
                  <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-emerald-200">
                    <div className="text-[11px] font-bold text-slate-900 flex items-center justify-between">
                      <span>Update 4-Digit Security PIN:</span>
                    </div>

                    <div>
                      <input
                        type="password"
                        maxLength={6}
                        value={newPinValue}
                        onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 1234"
                        className="w-full px-2.5 py-1.5 text-center text-sm font-mono font-black tracking-widest bg-white border border-slate-300 focus:border-emerald-500 rounded-lg text-emerald-800 outline-none"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSavePin(hotel.hotelId)}
                        disabled={isUpdatingPin || newPinValue.length < 4}
                        className="flex-1 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50 cursor-pointer font-mono"
                      >
                        {isUpdatingPin ? 'Saving...' : 'Update PIN'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingPinHotel(null); setNewPinValue(''); }}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Default Action Buttons */}
                {!isEditingCred && !isEditingPin && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCredHotel(hotel.hotelId);
                        setEditingPinHotel(null);
                        setNewUsernameValue(hotel.managerUsername || '');
                        setNewPasswordValue(hotel.managerPassword || '');
                      }}
                      className="flex-1 py-2 px-3 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit Credentials</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingPinHotel(hotel.hotelId);
                        setEditingCredHotel(null);
                        setNewPinValue('');
                      }}
                      className="py-2 px-3 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer font-mono"
                      title="Update 4-Digit Security PIN"
                    >
                      <Hash className="w-3.5 h-3.5" />
                      <span>PIN</span>
                    </button>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
