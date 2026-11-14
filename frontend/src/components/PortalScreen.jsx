import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Calendar, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function PortalScreen({ 
  onManagerLoginSuccess, 
  onAdminLoginSuccess, 
  targetRole = 'all', 
  adminLoggedIn = false, 
  managerLoggedIn = false, 
  activeHotelName = '', 
  onNavigate 
}) {
  // Input States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Live Animated Clock & Date State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Handle Unified Login Submit
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter your User ID and Password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();

      if (data.success) {
        if (data.role === 'admin') {
          setSuccessMsg('Verified Super Admin. Opening Control Dashboard...');
          setTimeout(() => {
            onAdminLoginSuccess(data.token);
          }, 350);
        } else if (data.role === 'manager') {
          setSuccessMsg(`Welcome to ${data.hotel?.name || 'Hotel'}! Opening Billing Engine...`);
          setTimeout(() => {
            onManagerLoginSuccess(data.hotel, data.token);
          }, 350);
        }
      } else {
        setErrorMsg(data.message || 'Invalid User ID or Password.');
      }
    } catch (err) {
      setErrorMsg('Unable to connect to server. Please verify network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to prefill demo credentials
  const fillCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
    setShowHelpModal(false);
  };

  return (
    <div 
      className="min-h-screen text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative bg-cover bg-center bg-no-repeat bg-fixed selection:bg-blue-600 selection:text-white"
      style={{
        backgroundColor: '#030712',
        backgroundImage: "radial-gradient(ellipse at 50% 35%, rgba(20, 65, 155, 0.40) 0%, rgba(8, 25, 65, 0.65) 50%, rgba(3, 7, 18, 0.92) 100%), url('/bg-gradient.jpg')"
      }}
    >
      
      {/* ========================================================= */}
      {/* TOP HEADER: Branding on Left & Animated Clock on Right     */}
      {/* ========================================================= */}
      <header className="max-w-7xl mx-auto w-full mb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-5 rounded-2xl bg-white/[0.05] backdrop-blur-2xl border border-white/10 shadow-2xl">
          
          {/* Left: Software Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white/20 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white font-serif">
                  Hotel Billing Software
                </h2>
                <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Multi-Property
                </span>
              </div>
              <p className="text-[11px] text-white/70 font-medium">
                Hospitality Point of Sale & Management Suite
              </p>
            </div>
          </div>

          {/* Right: Animated Live Clock & Date */}
          <div className="flex items-center gap-3 bg-black/30 border border-white/10 px-4 py-2 rounded-xl shadow-inner backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-amber-400 relative">
              {/* Custom Animated Clock with Rotating Hands (Pins) */}
              <svg 
                viewBox="0 0 24 24" 
                className="w-4 h-4 text-amber-400" 
                fill="none" 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9.5" strokeWidth="1.8" className="stroke-amber-400" />
                <line 
                  x1="12" y1="12" x2="12" y2="7.5" 
                  strokeWidth="2.2" 
                  className="stroke-amber-300"
                  style={{
                    transformOrigin: '12px 12px',
                    animation: 'spin 16s linear infinite'
                  }}
                />
                <line 
                  x1="12" y1="12" x2="16" y2="12" 
                  strokeWidth="1.8" 
                  className="stroke-amber-400"
                  style={{
                    transformOrigin: '12px 12px',
                    animation: 'spin 3s linear infinite'
                  }}
                />
                <circle cx="12" cy="12" r="1.3" className="fill-amber-400 stroke-none" />
              </svg>
            </div>
            <div>
              <div className="font-mono text-sm font-extrabold text-white tracking-widest leading-none">
                {formattedTime}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-cyan-300 font-medium mt-1">
                <Calendar className="w-3 h-3 text-cyan-400" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* CENTER: APPLE-STYLE MINIMALIST TRANSPARENT BLURRED LOGIN  */}
      {/* (Inspired directly by uploaded 1st image style)           */}
      {/* ========================================================= */}
      <main className="max-w-sm w-full mx-auto my-auto py-6">
        
        {/* Apple Style Translucent Frosted Glass Card */}
        <div className="bg-white/[0.08] backdrop-blur-3xl border border-white/20 rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(20,65,155,0.25)] relative overflow-hidden">
          
          {/* Top Subtle Light Reflection Effect */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

          {/* 1. Circular Avatar (Matching 1st Image) */}
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-[#0d2a5d]/90 border border-white/25 flex items-center justify-center shadow-xl shadow-blue-950/60 relative group">
              <svg 
                viewBox="0 0 24 24" 
                className="w-10 h-10 text-white stroke-[1.6]" 
                fill="none" 
                stroke="currentColor" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>

          {/* 2. Simple Minimalist Title (Matching 1st Image) */}
          <div className="text-center mb-6">
            <h1 className="text-base sm:text-lg font-light tracking-[0.28em] text-white/90 uppercase font-sans">
              {targetRole === 'admin' 
                ? 'Super Admin HQ' 
                : targetRole === 'manager' 
                  ? 'Property Manager' 
                  : 'Hotel Login'}
            </h1>
            <p className="text-[11px] text-blue-300 mt-1 font-mono tracking-wide">
              {targetRole === 'admin' 
                ? 'Central Headquarters Command' 
                : targetRole === 'manager' 
                  ? 'Frontdesk & Billing Operations' 
                  : 'Multi-Property Hospitality Suite'}
            </p>
          </div>

          {/* Quick Resume Badges (If already signed in to a portal) */}
          {(adminLoggedIn || managerLoggedIn) && (
            <div className="mb-6 p-3 rounded-2xl bg-blue-500/15 border border-blue-400/30 space-y-2 backdrop-blur-md">
              <div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider text-center">
                Active Session Detected
              </div>
              <div className="flex flex-col gap-1.5">
                {adminLoggedIn && (
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('/admin')}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600/60 hover:bg-blue-600 text-white font-semibold text-xs transition flex items-center justify-between cursor-pointer"
                  >
                    <span>👑 Open Super Admin HQ</span>
                    <span className="text-[10px] font-mono opacity-80">/admin →</span>
                  </button>
                )}
                {managerLoggedIn && (
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('/manager')}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600/60 hover:bg-emerald-600 text-white font-semibold text-xs transition flex items-center justify-between cursor-pointer"
                  >
                    <span>🏨 Open {activeHotelName || 'Manager'} Portal</span>
                    <span className="text-[10px] font-mono opacity-80">/manager →</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-6 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 animate-shake backdrop-blur-md">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <div className="flex-1 font-normal leading-tight">{errorMsg}</div>
            </div>
          )}

          {/* Success Message Alert */}
          {successMsg && (
            <div className="mb-6 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="flex-1 font-normal leading-tight">{successMsg}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Input 1: User ID / Username (Clean Underline Style) */}
            <div className="relative border-b border-white/40 focus-within:border-white transition-colors duration-200 py-1 flex items-center gap-3">
              <div className="text-white/70">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="User ID"
                className="w-full bg-transparent border-none text-white text-sm placeholder-white/50 focus:outline-none py-1.5 tracking-wide font-light"
              />
            </div>

            {/* Input 2: Password (Clean Underline Style) */}
            <div className="relative border-b border-white/40 focus-within:border-white transition-colors duration-200 py-1 flex items-center gap-3">
              <div className="text-white/70">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-transparent border-none text-white text-sm placeholder-white/50 focus:outline-none py-1.5 tracking-wide font-light"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-white/50 hover:text-white transition p-1"
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Only Help Option (Removed Remember Me & Forgot Password) */}
            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-xs text-white/70 hover:text-white transition font-light flex items-center gap-1.5 tracking-wide hover:underline cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help?</span>
              </button>
            </div>

            {/* Login Button (Matching 1st Image Deep Navy Sleek Rectangle) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-[#0a2558] hover:bg-[#0e3377] active:bg-[#071b40] border border-white/10 text-white font-semibold text-xs tracking-[0.25em] uppercase rounded shadow-lg shadow-black/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>LOGGING IN...</span>
                  </>
                ) : (
                  <span>LOGIN</span>
                )}
              </button>
            </div>

          </form>

        </div>

      </main>

      {/* ========================================================= */}
      {/* APPLE STYLE HELP MODAL (Triggered by Help Option)         */}
      {/* ========================================================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            
            {/* Close Button */}
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Portal Assistance & Help</h3>
                <p className="text-[11px] text-slate-400">Multi-Property Hotel Billing Suite</p>
              </div>
            </div>

            {/* Assistance Content */}
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-white/[0.04] rounded-xl border border-white/10">
                <p className="font-semibold text-white mb-1">User ID & Password Notice:</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Every hotel manager is assigned unique credentials by the Super Administrator. Once signed in, you are automatically directed to your assigned property dashboard.
                </p>
              </div>

              <div className="p-3 bg-white/[0.04] rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Super Admin / Helpdesk</div>
                  <div className="text-[11px] text-slate-400">Maa Tara Enterprise Support</div>
                </div>
                <a 
                  href="tel:9046926801" 
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Phone className="w-3 h-3" />
                  <span>9046926801</span>
                </a>
              </div>

              {/* Quick Demo Test Accounts Shortcut */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="font-semibold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Tap to Test Account:
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => fillCredentials('hotel1', 'hotel1234')}
                    className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-left transition"
                  >
                    <div className="font-bold text-blue-300">Hotel Rojana</div>
                    <div className="text-[10px] text-slate-400 font-mono">hotel1 / hotel1234</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('hotel2', 'hotel2345')}
                    className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-left transition"
                  >
                    <div className="font-bold text-emerald-300">Hotel Sagar Priya</div>
                    <div className="text-[10px] text-slate-400 font-mono">hotel2 / hotel2345</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('hotel3', 'hotel3456')}
                    className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-left transition"
                  >
                    <div className="font-bold text-indigo-300">Hotel Sea Pearl</div>
                    <div className="text-[10px] text-slate-400 font-mono">hotel3 / hotel3456</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials('admin', 'admin123')}
                    className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-left transition"
                  >
                    <div className="font-bold text-amber-300">Super Admin</div>
                    <div className="text-[10px] text-slate-400 font-mono">admin / admin123</div>
                  </button>
                </div>
              </div>

            </div>

            {/* Dismiss */}
            <div className="mt-4 pt-3 border-t border-white/10 text-right">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* BOTTOM FOOTER                                             */}
      {/* ========================================================= */}
      <footer className="text-center text-[11px] text-white/50 pt-2 pb-1 font-light tracking-wider">
        <p>
          Hotel Multi-Property Cloud Billing Platform • MongoDB Atlas Cloud Protected • v2.1
        </p>
      </footer>

    </div>
  );
}