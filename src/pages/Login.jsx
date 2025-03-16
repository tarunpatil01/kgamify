import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import backgroundImage from '../assets/background.jpg';
import { loginCompany } from '../api';

const Login = ({ setLoggedInEmail }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: localStorage.getItem("rememberedEmail") || "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem("rememberedEmail"));
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleRememberMeChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage(""); // Clear previous errors
    
    if (!formData.email || !formData.password) {
      setErrorMessage("Please enter both email and password");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Attempting login with:", formData.email);
      const response = await loginCompany(formData);
      
      console.log("Login response:", response);
      if (response.success) {
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        setLoggedInEmail(formData.email);
        localStorage.setItem('companyType', response.type);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error?.error === 'Your company is not approved by Admin yet') {
        setErrorMessage("Your company is not approved by Admin yet. Please wait for approval.");
      } else if (error?.error === 'Invalid credentials') {
        setErrorMessage("Invalid email or password. Please try again.");
      } else {
        setErrorMessage("An error occurred during login. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const img = new Image();
    img.src = backgroundImage;
  }, []);

  return (
    <div className="relative flex justify-center items-center h-screen bg-cover bg-center p-4 sm:p-8 bg-blur" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="bg-white bg-opacity-90 p-2 sm:p-10 rounded-2xl shadow-2xl w-full max-w-lg">
        <img
          src="src/assets/KLOGO.png"
          alt="Kgamify Logo"
          className="mx-auto mb-6 sm:mb-4 w-24 sm:w-32 h-24 sm:h-32 object-contain"
        />
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-800">Welcome to Kgamify</h1>
       
        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700 font-semibold">Email ID</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your Email ID"
              className="w-full p-3 sm:p-4  border border-gray-300 rounded-lg mt-2  focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your Password"
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {errorMessage && <p className="text-red-500 text-center font-medium">{errorMessage}</p>}
          <div className="flex items-center justify-between">
            <label className="flex items-center text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="mr-2 w-5 h-5"
                checked={rememberMe}
                onChange={handleRememberMeChange}
              />
              Remember Me
            </label>
            <a href="/forgot-password" className="text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#ff8200] text-white p-3 sm:p-4 rounded-full hover:bg-[#e57400] transition duration-300 font-semibold"
          >
            {isLoading ? "Logging in..." : "Login Now"}
          </button>
        </form>
        <div className="mt-6 sm:mt-8 text-center">
          <p>
            Not Registered Yet?{" "}
            <a href="/register" className="text-blue-600 hover:underline">
              Register now
            </a>
          </p>
        </div>
        <div className="mt-6 sm:mt-8 text-center">
          <Link to="/admin-login">
            <button className="w-full bg-gray-800 text-white p-3 sm:p-4 rounded-full hover:bg-gray-900 transition duration-300 font-semibold">
              Admin Portal
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
