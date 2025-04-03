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
    <div className="relative flex justify-center items-center min-h-screen bg-cover bg-center p-3 sm:p-6 md:p-8 bg-blur" 
         style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="bg-white bg-opacity-90 p-4 sm:p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-md md:max-w-lg">
        <div className="flex justify-center">
          <img
            src="src/assets/KLOGO.png"
            alt="Kgamify Logo"
            className="mb-4 sm:mb-6 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-center text-gray-800">Welcome to Kgamify</h1>
       
        <form className="space-y-3 sm:space-y-4 md:space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm sm:text-base text-gray-700 font-semibold mb-1">Email ID</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your Email ID"
              className="w-full p-2.5 sm:p-3 md:p-4 text-sm sm:text-base border border-gray-300 rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm sm:text-base text-gray-700 font-semibold mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your Password"
              className="w-full p-2.5 sm:p-3 md:p-4 text-sm sm:text-base border border-gray-300 rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {errorMessage && (
            <p className="text-red-500 text-center text-xs sm:text-sm font-medium py-1">{errorMessage}</p>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <label className="flex items-center text-gray-700 text-sm sm:text-base cursor-pointer">
              <input
                type="checkbox"
                className="mr-2 w-4 h-4"
                checked={rememberMe}
                onChange={handleRememberMeChange}
              />
              Remember Me
            </label>
            <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm sm:text-base">
              Forgot password?
            </Link>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#ff8200] text-white p-2.5 sm:p-3 md:p-4 rounded-full hover:bg-[#e57400] 
                     transition duration-300 text-sm sm:text-base font-semibold"
          >
            {isLoading ? "Logging in..." : "Login Now"}
          </button>
        </form>
        
        <div className="mt-4 sm:mt-6 md:mt-8 text-center text-sm sm:text-base">
          <p>
            Not Registered Yet?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register now
            </Link>
          </p>
        </div>
        
        <div className="mt-3 sm:mt-4 md:mt-6 text-center">
          <Link to="/admin-login" className="inline-block w-full">
            <button className="w-full bg-gray-800 text-white p-2.5 sm:p-3 md:p-4 rounded-full hover:bg-gray-900 
                             transition duration-300 text-sm sm:text-base font-semibold">
              Admin Portal
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
