import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import backgroundImage from '../assets/background.jpg';
import logo from '../assets/KLOGO.png';
import { requestPasswordReset, verifyOtp } from '../api';

const ForgetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: request OTP, 2: verify OTP

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await requestPasswordReset(email);
      const successMsg = res?.message || 'If this email is registered, an OTP has been sent.';
      setMessage(successMsg);
      setStep(2);
  } catch {
      // Show a friendly error instead of raw status text
      setMessage('Error: Unable to send OTP right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await verifyOtp(email, code);
      const token = res?.token;
      if (token) {
        localStorage.setItem('resetToken', token);
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        setMessage('Invalid server response. Please request a new OTP.');
      }
    } catch (error) {
      const apiMsg = error?.error || error?.message || 'Invalid or expired OTP.';
      setMessage(`Error: ${apiMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-800/20 to-pink-900/20"></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo section */}
        <div className="text-center">
          <img
            className="mx-auto h-16 w-auto drop-shadow-lg"
            src={logo}
            alt="Kgamify Logo"
          />
          <h2 className="mt-6 text-3xl font-extrabold text-white drop-shadow-lg">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-200">
            Enter your email address and we&apos;ll send you a 6-digit OTP to reset your password.
          </p>
        </div>

        {/* Form card */}
        <div className="backdrop-blur-md bg-white/95 p-8 rounded-2xl shadow-2xl border border-white/20">
          <form className="space-y-6" onSubmit={step === 1 ? handleRequestOtp : handleVerifyOtp}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-kgamify"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={step === 2}
              />
            </div>

            {step === 2 && (
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP Code
                </label>
                <input
                  id="code"
                  name="code"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="^[0-9]{6}$"
                  maxLength={6}
                  title="Enter the 6-digit OTP code"
                  required
                  className="input-kgamify"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(digits);
                  }}
                />
                <p className="mt-2 text-xs text-gray-600">We sent a 6-digit code to your email. It expires in 10 minutes.</p>
              </div>
            )}

            {message && (
              <div className={`p-4 rounded-lg text-sm ${
                message.includes('Error') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || (step === 2 && code.length !== 6)}
                className="btn-primary"
              >
                {loading ? 'Processing...' : step === 1 ? 'Send OTP' : 'Verify OTP'}
              </button>
            </div>

            <div className="text-center space-y-3">
              
              <div className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200"
                >
                  Register
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;
