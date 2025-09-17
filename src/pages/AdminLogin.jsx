import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api";
import backgroundImage from "../assets/dashboard.png"; // Updated background image
import Klogo from "../assets/KLOGO.png"; // Add logo import

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); // Changed to email state
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    
    try {
      // Make sure email and password are provided
      if (!email || !password) {
        setErrorMessage("Please provide both email and password");
        return;
      }
      
      const response = await adminLogin({ email, password }); // Changed to email for the login request
      
      if (response && response.token) {
        // Store token in localStorage for authenticated requests
        localStorage.setItem("adminToken", response.token);
        localStorage.setItem("adminData", JSON.stringify(response.admin));
        
        // Navigate to admin dashboard
        navigate("/admin");
      } else {
        setErrorMessage("Invalid admin credentials");
      }
  } catch (error) {
      setErrorMessage(
        error.message || "Invalid admin credentials. Please try again."
      );
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-8 px-2 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Modern animated gradient background with subtle pattern overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(120deg, #fff7e6 0%, #ffecd2 40%, #ffe3b3 100%)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 80% 20%, #ffb34733 0%, transparent 60%), radial-gradient(circle at 20% 80%, #ff820033 0%, transparent 60%)",
            opacity: 0.7,
          }}
        />
        <div
          className="absolute inset-0 animate-gradient-move"
          style={{
            background:
              "linear-gradient(120deg, #ffecd2 0%, #ffb347 100%)",
            opacity: 0.15,
            mixBlendMode: "multiply",
          }}
        />
        <style>
          {`
            @keyframes gradient-move {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .animate-gradient-move {
              background-size: 200% 200%;
              animation: gradient-move 10s ease-in-out infinite;
            }
            input.hide-native-reveal::-ms-reveal,
            input.hide-native-reveal::-ms-clear {
              display: none;
            }
          `}
        </style>
      </div>
      <div className="w-full max-w-md mx-auto rounded-3xl shadow-2xl border bg-white border-orange-200 p-6 sm:p-10 relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-6">
          <img
            src={Klogo}
            alt="kGamify Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3 object-contain drop-shadow-lg"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-center tracking-tight bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent drop-shadow-lg mb-1">
            Admin Login
          </h1>
          <p className="text-black text-base sm:text-lg text-center mb-6">
            Sign in to your Admin account
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="mb-4 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400 transition duration-300"
        >
          Back
        </button>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold text-black mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition caret-black placeholder-gray-400 hide-native-reveal"
                required
                placeholder="Enter your admin email address"
                style={{ color: '#111', background: '#fff', caretColor: '#111' }}
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-black mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition caret-black placeholder-gray-400 hide-native-reveal"
                required
                placeholder="Enter your password"
                style={{ color: '#111', background: '#fff', caretColor: '#111' }}
              />
            </div>
          </div>
          {errorMessage && (
            <div className="border rounded-lg p-3 bg-red-50/90 border-red-200" role="alert">
              <p className="text-sm font-medium text-red-600 text-center">{errorMessage}</p>
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-lg shadow-lg transition duration-300 bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white hover:from-[#e57400] hover:to-[#ffb347] flex items-center justify-center"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
