// Clean simplified Register page (two-step: basic signup + OTP) matching Login styling
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import Klogo from '../assets/KLOGO.png';
import { registerBasic, verifySignupOtp, resendSignupOtp } from '../api';
import { quickEmail, quickPassword, quickRequired, quickMatch } from '../utils/validation';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import PropTypes from 'prop-types';

const Register = () => {
  const navigate = useNavigate();
  const [step,setStep]=useState(1); // 1=basic, 2=otp
  const [form,setForm]=useState({companyName:'',email:'',phone:'',password:'',confirmPassword:''});
  const [showPassword,setShowPassword]=useState(false);
  const [showConfirmPassword,setShowConfirmPassword]=useState(false);
  const [isSubmitting,setIsSubmitting]=useState(false);
  const [isOtpSending,setIsOtpSending]=useState(false);
  const [otpCode,setOtpCode]=useState('');
  const [otpTimer,setOtpTimer]=useState(0);
  const [openSnackbar,setOpenSnackbar]=useState(false);
  const [snackbarMessage,setSnackbarMessage]=useState('');
  const [snackbarSeverity,setSnackbarSeverity]=useState('success');
  const handleCloseSnackbar=(e,r)=>{ if(r==='clickaway') return; setOpenSnackbar(false); };

  function handleChange(e){ const {name,value}=e.target; setForm(p=>({...p,[name]:value})); }

  async function submitBasic(e){
    e.preventDefault();
    const companyName = (form.companyName || '').trim();
    const email = (form.email || '').trim();
    const phone = (form.phone || '').trim();
    const errors = [
      quickRequired(companyName,'Company name'),
      quickEmail(email),
      quickRequired(phone,'Phone'),
      quickPassword(form.password,6),
      quickMatch(form.password, form.confirmPassword, 'Passwords')
    ].filter(Boolean);
    if(errors.length){ setSnackbarMessage(errors[0]); setSnackbarSeverity('error'); setOpenSnackbar(true); return; }
    try {
      setIsSubmitting(true);
      await registerBasic({ companyName, email, phone, password: form.password });
      setSnackbarMessage('Account created. OTP sent to email.');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setStep(2);
      setOtpTimer(60);
    } catch(err){
      setSnackbarMessage(err?.message||'Signup failed');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally { setIsSubmitting(false);} }

  useEffect(()=>{ let t; if(step===2 && otpTimer>0){ t=setTimeout(()=>setOtpTimer(s=>s-1),1000);} return ()=>clearTimeout(t); },[otpTimer,step]);

  async function verifyOtp(e){ e.preventDefault(); try{ setIsOtpSending(true); await verifySignupOtp(form.email, otpCode.trim()); setSnackbarMessage('Email verified. Redirecting...'); setSnackbarSeverity('success'); setOpenSnackbar(true); setTimeout(()=>navigate('/'),1500);}catch(err){ setSnackbarMessage(err.message||'OTP verification failed'); setSnackbarSeverity('error'); setOpenSnackbar(true);} finally { setIsOtpSending(false);} }
  async function resend(){ if(otpTimer>0) return; try{ setIsOtpSending(true); await resendSignupOtp(form.email); setOtpTimer(60);}catch(err){ setSnackbarMessage(err.message||'Resend failed'); setSnackbarSeverity('error'); setOpenSnackbar(true);} finally { setIsOtpSending(false);} }

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-2 sm:px-6 lg:px-8 relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" style={{background:'linear-gradient(120deg,#fff7e6 0%,#ffecd2 40%,#ffe3b3 100%)'}}>
        <div className="absolute inset-0" style={{background:'radial-gradient(circle at 80% 20%, #ffb34733 0%, transparent 60%), radial-gradient(circle at 20% 80%, #ff820033 0%, transparent 60%)',opacity:0.7}}/>
        <div className="absolute inset-0 animate-gradient-move" style={{background:'linear-gradient(120deg,#ffecd2 0%,#ffb347 100%)',opacity:0.15,mixBlendMode:'multiply'}}/>
        <style>{`@keyframes gradient-move{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}.animate-gradient-move{background-size:200% 200%;animation:gradient-move 10s ease-in-out infinite;}input.hide-native-reveal::-ms-reveal,input.hide-native-reveal::-ms-clear{display:none;}`}</style>
      </div>
      <div className="w-full max-w-md mx-auto rounded-3xl shadow-2xl border bg-white border-orange-200 p-6 sm:p-10 relative z-10">
        <div className="text-center mb-6">
          <img src={Klogo} alt="kGamify Logo" className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 object-contain drop-shadow-lg" />
          {step===1 && (<><h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent drop-shadow-lg mb-1">Create Account</h1><p className="text-black text-base sm:text-lg">Start hiring with kGamify</p></>)}
          {step===2 && (<><h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent drop-shadow-lg mb-1">Verify Email</h1><p className="text-black text-sm sm:text-base">Enter the 6-digit code sent to <strong>{form.email}</strong></p></>)}
        </div>
        {step===1 && (
          <form onSubmit={submitBasic} className="space-y-5">
            <div><label className="block font-semibold text-black mb-2">Company Name <span className="text-red-500">*</span></label><input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Your company" className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition placeholder-gray-400" required /></div>
            <div><label className="block font-semibold text-black mb-2">Email <span className="text-red-500">*</span></label><input type="email" name="email" value={form.email} onChange={handleChange} placeholder="company@email.com" autoComplete="email" className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition placeholder-gray-400" required /></div>
            <div><label className="block font-semibold text-black mb-2">Phone <span className="text-red-500">*</span></label><input name="phone" value={form.phone} onChange={handleChange} placeholder="Contact number" className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition placeholder-gray-400" required /></div>
            <div><label className="block font-semibold text-black mb-2">Password <span className="text-red-500">*</span></label><div className="relative"><input type={showPassword?'text':'password'} name="password" value={form.password} onChange={handleChange} placeholder="Create password" autoComplete="new-password" className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition hide-native-reveal placeholder-gray-400" minLength={6} required style={{WebkitTextSecurity: showPassword?'none':'disc'}} /><button type="button" onClick={()=>setShowPassword(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-[#ff8200]" tabIndex={-1}>{showPassword? <FaEyeSlash/>:<FaEye/>}</button></div></div>
            <div><label className="block font-semibold text-black mb-2">Confirm Password <span className="text-red-500">*</span></label><div className="relative"><input type={showConfirmPassword?'text':'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password" autoComplete="new-password" className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition hide-native-reveal placeholder-gray-400" minLength={6} required style={{WebkitTextSecurity: showConfirmPassword?'none':'disc'}} /><button type="button" onClick={()=>setShowConfirmPassword(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-[#ff8200]" tabIndex={-1}>{showConfirmPassword? <FaEyeSlash/>:<FaEye/>}</button></div></div>
            <button disabled={isSubmitting} className="w-full py-3 rounded-xl font-bold text-lg shadow-lg transition duration-300 bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white hover:from-[#e57400] hover:to-[#ffb347] flex items-center justify-center">{isSubmitting? <><FaSpinner className="animate-spin mr-2"/>Creating...</> : 'Create Account'}</button>
            <div className="text-center pt-4 border-t border-gray-200/50"><p className="text-black text-sm">Already have an account? <Link to="/" className="text-[#ff8200] hover:text-[#e57400] font-semibold transition-colors">Sign in</Link></p></div>
          </form>
        )}
        {step===2 && (
          <form onSubmit={verifyOtp} className="space-y-6">
            <div><label className="block font-semibold text-black mb-2">OTP Code <span className="text-red-500">*</span></label><input value={otpCode} onChange={e=>setOtpCode(e.target.value)} maxLength={6} placeholder="123456" className="tracking-widest text-center text-lg w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition placeholder-gray-400" required /></div>
            <button disabled={isOtpSending} className="w-full py-3 rounded-xl font-bold text-lg shadow-lg transition duration-300 bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white hover:from-[#e57400] hover:to-[#ffb347] flex items-center justify-center">{isOtpSending? <><FaSpinner className="animate-spin mr-2"/>Verifying...</> : 'Verify & Login'}</button>
            <button type="button" disabled={otpTimer>0 || isOtpSending} onClick={resend} className="w-full text-sm text-[#ff8200] disabled:opacity-40">Resend OTP {otpTimer>0 && `in ${otpTimer}s`}</button>
            <div className="text-center pt-2 border-t border-gray-200/50"><p className="text-black text-sm">Wrong email? <button type="button" onClick={()=>setStep(1)} className="text-[#ff8200] hover:text-[#e57400] font-semibold">Go back</button></p></div>
          </form>
        )}
      </div>
      <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{vertical:'top',horizontal:'center'}}><Alert severity={snackbarSeverity} onClose={handleCloseSnackbar}>{snackbarMessage}</Alert></Snackbar>
    </div>
  );
};

export default Register;

Register.propTypes = { isDarkMode: PropTypes.bool };

