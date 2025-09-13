import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSpinner } from 'react-icons/fa';
import { verifySignupOtp, resendSignupOtp } from '../api';

// Lightweight email verification page for existing (logged in or just logged) users
export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialEmail = params.get('email') || localStorage.getItem('pendingVerifyEmail') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('Enter the 6‑digit code we sent to your email.');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(()=>{
    if(resendTimer<=0) return; const t=setTimeout(()=>setResendTimer(s=>s-1),1000); return ()=>clearTimeout(t);
  },[resendTimer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !code) { setError('Email and code are required'); return; }
    setLoading(true);
    try {
      await verifySignupOtp(email, code.trim());
      setMessage('Email verified successfully. Redirecting...');
      // Update cached company data if exists
      try {
        const cd = JSON.parse(localStorage.getItem('companyData')||'null');
        if (cd && cd.email === email) { cd.emailVerified = true; localStorage.setItem('companyData', JSON.stringify(cd)); }
      } catch {}
      localStorage.removeItem('companyNeedsEmailVerification');
      setTimeout(()=>navigate('/dashboard'), 1200);
    } catch(err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if(resendTimer>0 || !email) return;
    setResendLoading(true); setError('');
    try { await resendSignupOtp(email); setResendTimer(60); setMessage('OTP resent. Check your inbox.'); }
    catch(err){ setError(err.message || 'Failed to resend'); }
    finally { setResendLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <div className="w-full max-w-md bg-white border border-orange-200 rounded-3xl shadow-xl p-8 relative">
        <h1 className="text-2xl font-extrabold mb-2 bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent">Verify Your Email</h1>
        <p className="text-sm text-gray-700 mb-4">{message}</p>
        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block font-semibold mb-1 text-gray-800">Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@company.com" className="w-full px-4 py-3 rounded-xl border bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none text-sm" required />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-gray-800">OTP Code</label>
            <input value={code} onChange={e=>setCode(e.target.value)} maxLength={6} placeholder="123456" className="tracking-widest text-center text-lg w-full px-4 py-3 rounded-xl border bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none" required />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3" role="alert">{error}</div>}
          <button disabled={loading} className="w-full py-3 rounded-xl font-bold text-lg shadow-lg transition duration-300 bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white hover:from-[#e57400] hover:to-[#ffb347] flex items-center justify-center disabled:opacity-70">
            {loading ? <><FaSpinner className="animate-spin mr-2"/>Verifying...</> : 'Verify Email'}
          </button>
        </form>
        <div className="mt-4 flex items-center justify-between">
          <button onClick={handleResend} disabled={resendLoading || resendTimer>0 || !email} className="text-xs font-semibold text-[#ff8200] hover:text-[#e57400] disabled:opacity-40 flex items-center">
            {resendLoading ? <><FaSpinner className="animate-spin mr-1"/>Sending...</> : resendTimer>0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
          </button>
          <button onClick={()=>navigate('/dashboard')} className="text-xs text-gray-600 hover:text-gray-800">Skip for now</button>
        </div>
      </div>
    </div>
  );
}
