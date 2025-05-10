import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import backgroundImage from "../assets/background.jpg";
import { resetPassword } from "../api";

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

  return (
    <div
      className="flex justify-center items-center h-screen bg-cover bg-center p-4 sm:p-8"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="bg-white bg-opacity-90 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="mb-4 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400 transition duration-300"
        >
          Back to Login
        </button>
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Set New Password
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Enter your new password below.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              readOnly
              disabled
            />
          </div>

          <div className="mb-6 relative">
            <label className="block text-gray-700 font-semibold mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                required
                placeholder="Enter new password"
                disabled={resetComplete}
                pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                title="Must contain at least one number, one uppercase and lowercase letter, and at least 8 or more characters"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="mb-6 relative">
            <label className="block text-gray-700 font-semibold mb-2">
              Confirm New Password
            </label>
            <input
              type={passwordVisible ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Confirm new password"
              disabled={resetComplete}
            />
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Password must contain at least one number, one uppercase letter, one lowercase letter, and be at least 8 characters long.
          </p>
          
          {message && (
            <div className={`p-3 rounded-lg mb-4 ${
              messageType === "success" 
                ? "bg-green-100 text-green-700" 
                : "bg-red-100 text-red-700"
            }`}>
              {message}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || resetComplete}
            className={`w-full ${resetComplete ? 'bg-green-500' : 'bg-[#ff8200]'} text-white p-3 rounded-full hover:${resetComplete ? 'bg-green-600' : 'bg-[#e57400]'} transition duration-300 font-semibold ${(resetComplete || isSubmitting) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? "Resetting..." : resetComplete ? "Password Reset Successful" : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
