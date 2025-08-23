import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api";
import backgroundImage from "../assets/background.jpg"; // Import background image

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
      console.error("Login error:", error);
      setErrorMessage(
        error.message || "Invalid admin credentials. Please try again."
      );
    }
  };

  return (
    <div
      className="flex justify-center items-center h-screen bg-cover bg-center p-4 sm:p-8"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="bg-white bg-opacity-90 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <button
          onClick={() => navigate("/")} // Navigate back to the main page
          className="mb-4 bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400 transition duration-300"
        >
          Back
        </button>
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Admin Login
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="w-full p-3 border border-gray-300 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className="w-full p-3 border border-gray-300 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {errorMessage && (
            <p className="text-red-500 text-center">{errorMessage}</p>
          )}
          <button
            type="submit"
            className="w-full bg-[#ff8200] text-white p-3 rounded-full hover:bg-[#e57400] transition duration-300 font-semibold"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
