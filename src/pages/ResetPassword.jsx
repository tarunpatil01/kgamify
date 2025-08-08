import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import backgroundImage from "../assets/background.jpg";
import { resetPassword } from "../api";
import logo from "../assets/KLOGO.png";
import PropTypes from 'prop-types';

const ResetPassword = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  useEffect(() => {
    // Get token and email from URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (tokenParam) setToken(tokenParam);
    if (emailParam) setEmail(emailParam);

    if (!tokenParam || !emailParam) {
      setMessage("Invalid reset link. Please request a new password reset.");
      setMessageType("error");
    }
  }, [location]);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Basic validation
    if (password !== confirmPassword) {
      setMessage("Passwords don't match");
      setMessageType("error");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await resetPassword(token, email, password);
      
      setMessage(response.message || "Password has been reset successfully");
      setMessageType("success");
      setResetComplete(true);
      
      // Redirect to login page after successful reset
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      setMessage(error.error || "Something went wrong. Please try again.");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const overlayTone = isDarkMode ? 'bg-black/50' : 'bg-black/30';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background overlays */}
      <div className={`absolute inset-0 ${overlayTone} backdrop-blur-[1px]`}></div>
      <div className="absolute inset-0 bg-gradient-to-br from-kgamify-500/20 via-transparent to-kgamify-pink-500/20"></div>

      {/* Card */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md">
        {/* Header */}
        <button
          onClick={() => navigate("/")}
          className="mb-4 w-full text-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to Login
        </button>

        <div className="text-center mb-6">
          <img src={logo} alt="Kgamify" className="mx-auto h-14 w-14 rounded-full shadow-md" />
          <h1 className="mt-3 text-2xl sm:text-3xl font-heading font-bold text-gray-800">
            Set New Password
          </h1>
          <p className="text-gray-600 mt-1">Enter your new password below.</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            messageType === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-kgamify"
              required
              readOnly
              disabled
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">New Password</label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-kgamify has-icon"
                required
                placeholder="Enter new password"
                disabled={resetComplete}
                pattern="(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                title="Must contain at least one number, one uppercase and lowercase letter, and at least 8 or more characters"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Confirm New Password</label>
            <input
              type={passwordVisible ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-kgamify"
              required
              placeholder="Confirm new password"
              disabled={resetComplete}
            />
          </div>

          <p className="text-xs text-gray-600">Password must contain at least one number, one uppercase letter, one lowercase letter, and be at least 8 characters long.</p>

          <button
            type="submit"
            disabled={isSubmitting || resetComplete}
            className={resetComplete ? "btn-primary" : "btn-primary"}
          >
            {isSubmitting ? "Resetting..." : resetComplete ? "Password Reset Successful" : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

ResetPassword.propTypes = {
  isDarkMode: PropTypes.bool,
};

export default ResetPassword;
