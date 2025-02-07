import React, { useState } from "react";
import backgroundImage from "../assets/background.jpg"; // Import background image

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handleOtpChange = (event) => {
    setEnteredOtp(event.target.value);
  };

  const handleNewPasswordChange = (event) => {
    setNewPassword(event.target.value);
  };

  const handleSendOtp = (event) => {
    event.preventDefault();
    // Mock function to send OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Sending OTP to ${email}: ${generatedOtp}`);
    setOtp(generatedOtp);
    setOtpSent(true);
  };

  const handleVerifyOtp = (event) => {
    event.preventDefault();
    if (enteredOtp === otp) {
      setOtpVerified(true);
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  const handleChangePassword = (event) => {
    event.preventDefault();
    // Mock function to change password
    console.log(`Changing password for ${email} to ${newPassword}`);
    alert("Password changed successfully!");
  };

  return (
    <div
      className="flex justify-center items-center h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>
        {!otpSent ? (
          <form onSubmit={handleSendOtp}>
            <div className="mb-4">
              <label className="block text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
                className="w-full p-3 border border-gray-300 rounded mt-1"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition duration-300"
            >
              Send OTP
            </button>
          </form>
        ) : !otpVerified ? (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-4">
              <label className="block text-gray-700">Enter OTP</label>
              <input
                type="text"
                value={enteredOtp}
                onChange={handleOtpChange}
                placeholder="Enter the OTP sent to your email"
                className="w-full p-3 border border-gray-300 rounded mt-1"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition duration-300"
            >
              Verify OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword}>
            <div className="mb-4">
              <label className="block text-gray-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={handleNewPasswordChange}
                placeholder="Enter your new password"
                className="w-full p-3 border border-gray-300 rounded mt-1"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition duration-300"
            >
              Change Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;