import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import backgroundImage from '../assets/background.jpg';
import Klogo from '../assets/KLOGO.png';
import { loginCompany } from '../api';
import PropTypes from 'prop-types';

const Login = ({ setLoggedInEmail }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: localStorage.getItem("rememberedEmail") || "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem("rememberedEmail"));
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Real-time validation
  const validateField = (name, value) => {
    const errors = {};
    
    if (name === 'email') {
      if (!value) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    
    if (name === 'password') {
      if (!value) {
        errors.password = 'Password is required';
      } else if (value.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    }
    
    return errors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
    
    // Clear error message when user starts typing
    if (errorMessage) setErrorMessage("");
    
    // Real-time validation
    if (touched[name]) {
      const fieldErrors = validateField(name, value);
      setValidationErrors(prev => ({
        ...prev,
        [name]: fieldErrors[name]
      }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const fieldErrors = validateField(name, value);
    setValidationErrors(prev => ({
      ...prev,
      [name]: fieldErrors[name]
    }));
  };

  const handleRememberMeChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Password strength indicator (for future registration forms)
  // password strength reserved for future use

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage(""); // Clear previous errors
    
    // Validate all fields
    const emailErrors = validateField('email', formData.email);
    const passwordErrors = validateField('password', formData.password);
    const allErrors = { ...emailErrors, ...passwordErrors };
    
    if (Object.keys(allErrors).length > 0) {
      setValidationErrors(allErrors);
      setTouched({ email: true, password: true });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await loginCompany(formData);
      
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
    <div 
      className="min-h-screen font-primary relative flex items-center justify-center p-2 sm:p-4 overflow-auto"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-kgamify-500/20 via-transparent to-kgamify-pink-500/20"></div>
      
      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md my-4 sm:my-8">
        {/* Logo Section */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="relative">
            <div className="absolute -inset-4 bg-white/10 backdrop-blur-md rounded-full"></div>
            <img
              src={Klogo}
              alt="Kgamify Logo"
              className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-white mb-1 sm:mb-2 drop-shadow-lg">
            Welcome Back
          </h1>
          <p className="text-white/90 text-sm sm:text-base md:text-lg drop-shadow">
            Sign in to your Kgamify account
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 p-4 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label className="block font-medium text-gray-800 mb-1 sm:mb-2">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your email address"
                  className={`input-kgamify ${
                    validationErrors.email 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : touched.email && !validationErrors.email 
                        ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                        : ''
                  }`}
                  aria-describedby={validationErrors.email ? "email-error" : undefined}
                  required
                />
                {touched.email && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validationErrors.email ? (
                      <FaTimesCircle className="text-red-500" />
                    ) : (
                      <FaCheckCircle className="text-green-500" />
                    )}
                  </div>
                )}
              </div>
              {validationErrors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block font-medium text-gray-800 mb-1 sm:mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your password"
                  className={`input-kgamify has-icon ${
                    validationErrors.password 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : touched.password && !validationErrors.password 
                        ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                        : ''
                  }`}
                  aria-describedby={validationErrors.password ? "password-error" : undefined}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {validationErrors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  className="w-4 h-4 text-kgamify-500 bg-white/80 border-gray-300 rounded focus:ring-kgamify-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Remember me
                </span>
              </label>
              <Link 
                to="/forgot-password" 
                className="text-sm text-kgamify-600 hover:text-kgamify-700 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-lg p-3" role="alert">
                <p className="text-red-600 text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <FaSpinner className="animate-spin mr-2" />
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Register Link */}
            <div className="text-center pt-3 border-t border-gray-200/50">
              <p className="text-gray-700 text-sm">
                Don&apos;t have an account?{" "}
                <Link 
                  to="/register" 
                  className="text-kgamify-600 hover:text-kgamify-700 font-medium transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>

            {/* Admin Portal Link removed as per requirements */}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

Login.propTypes = {
  setLoggedInEmail: PropTypes.func,
};
