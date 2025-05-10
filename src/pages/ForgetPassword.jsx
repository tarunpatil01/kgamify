import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/background.jpg";
import { requestPasswordReset } from "../api";

const ForgotPassword = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetLinkSent, setResetLinkSent] = useState(false);

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await requestPasswordReset(email);

      setMessage(
        response.message ||
          "If an account exists with this email, a password reset link has been sent."
      );
      setMessageType("success");
      setResetLinkSent(true);

      // For development: show reset link if returned from API
      if (response.resetLink) {
        console.log("Reset link:", response.resetLink);
        // In development mode, offer to redirect to reset password page
        setTimeout(() => {
          const shouldRedirect = window.confirm(
            "For development: Do you want to be redirected to the reset password page?"
          );
          if (shouldRedirect) {
            window.location.href = response.resetLink;
          }
        }, 1500);
      }
    } catch (error) {
      setMessage(
        error.error || "Something went wrong. Please try again later."
      );
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
          Reset Password
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Enter your email address and we'll send you instructions to reset your
          password.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter your registered email"
              disabled={resetLinkSent}
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg mb-4 ${
                messageType === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || resetLinkSent}
            className={`w-full ${
              resetLinkSent ? "bg-green-500" : "bg-[#ff8200]"
            } text-white p-3 rounded-full hover:${
              resetLinkSent ? "bg-green-600" : "bg-[#e57400]"
            } transition duration-300 font-semibold ${
              resetLinkSent || isSubmitting
                ? "opacity-70 cursor-not-allowed"
                : ""
            }`}
          >
            {isSubmitting
              ? "Sending..."
              : resetLinkSent
              ? "Email Sent"
              : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
