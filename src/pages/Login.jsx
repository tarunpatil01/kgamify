import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    try {
      const response = await loginCompany(formData);
      if (response.success) {
        setLoggedInEmail(formData.email);
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        navigate("/dashboard");
      } else {
        setErrorMessage(response.error);
      }
    } catch (error) {
      setErrorMessage(error.error);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
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
            />
          </div>
          {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}
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
            className="w-full bg-blue-600 text-white p-3 sm:p-4 rounded-full hover:bg-blue-700 transition duration-300 font-semibold"
          >
            Login Now
          </button>
        </form>
        <div className="mt-6 sm:mt-8 text-center">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-black p-3 sm:p-4 rounded-full border border-gray-300 hover:bg-gray-100 transition duration-300 flex items-center justify-center font-semibold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-5 h-5 mr-2"
            >
              <path
                fill="#4285F4"
                d="M24 9.5c3.9 0 7.1 1.3 9.5 3.4l7.1-7.1C36.2 2.1 30.5 0 24 0 14.6 0 6.4 5.4 2.5 13.3l8.3 6.4C12.8 13.2 17.9 9.5 24 9.5z"
              />
              <path
                fill="#34A853"
                d="M46.5 24c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3.1-2.4 5.7-4.9 7.4l7.5 5.8c4.4-4.1 7-10.1 7-17.7z"
              />
              <path
                fill="#FBBC05"
                d="M12.8 28.7c-1.1-3.1-1.1-6.5 0-9.6L4.5 12.7C1.6 17.3 0 22.9 0 28.5c0 5.6 1.6 11.2 4.5 15.8l8.3-6.4z"
              />
              <path
                fill="#EA4335"
                d="M24 48c6.5 0 12.1-2.1 16.1-5.7l-7.5-5.8c-2.1 1.4-4.8 2.3-7.6 2.3-6.1 0-11.2-4.1-13-9.6l-8.3 6.4C6.4 42.6 14.6 48 24 48z"
              />
            </svg>
            Login with Google
          </button>
        </div>
        <div className="mt-6 sm:mt-8 text-center">
          <p>
            Not Registered Yet?{" "}
            <a href="/register" className="text-blue-600 hover:underline">
              Register now
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
