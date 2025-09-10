import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Klogo from '../assets/KLOGO.png';
import { loginCompany } from '../api';
import PropTypes from 'prop-types';

const Login = ({ setLoggedInEmail }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: localStorage.getItem("rememberedIdentifier") || "",
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
    
    if (name === 'identifier') {
      if (!value) {
        errors.identifier = 'Username or Email is required';
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
  const emailErrors = validateField('identifier', formData.identifier);
    const passwordErrors = validateField('password', formData.password);
    const allErrors = { ...emailErrors, ...passwordErrors };
    
    if (Object.keys(allErrors).length > 0) {
      setValidationErrors(allErrors);
  setTouched({ identifier: true, password: true });
      return;
    }
    
    setIsLoading(true);
    try {
  const response = await loginCompany({ identifier: formData.identifier, password: formData.password });
      
      if (response.success) {
        if (rememberMe) {
          localStorage.setItem("rememberedIdentifier", formData.identifier);
          if (response.company?.email) {
            localStorage.setItem("rememberedEmail", response.company.email);
          }
        } else {
          localStorage.removeItem("rememberedIdentifier");
        }
        setLoggedInEmail(response.company?.email || "");
        localStorage.setItem('companyType', response.type);
        if (response.token) {
          localStorage.setItem('companyToken', response.token);
        }
        navigate("/dashboard");
      }
    } catch (error) {
      if (error?.error === 'Your company is not approved by Admin yet' || error?.error === 'Your account is on hold') {
        setErrorMessage("Your account is on hold. Please check Messages for details.");
      } else if (error?.error === 'Invalid credentials') {
        setErrorMessage("Invalid username/email or password. Please try again.");
      } else {
        setErrorMessage("An error occurred during login. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Removed preloading of background image
  }, []);

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
            /* Hide native Edge password reveal/clear to avoid double eye */
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
            alt="Kgamify Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3 object-contain drop-shadow-lg"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-center tracking-tight bg-gradient-to-r from-[#ff8200] to-[#ffb347] bg-clip-text text-transparent drop-shadow-lg mb-1">
            Welcome Back
          </h1>
          <p className="text-black text-base sm:text-lg">
            Sign in to your Kgamify account
          </p>
        </div>

        {/* Login Form Card */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username or Email Field */}
          <div>
            <label className="block font-semibold text-black mb-2">
              Username or Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your username or email address"
                autoComplete="username email"
                className={`w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition ${
                  validationErrors.identifier
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : touched.identifier && !validationErrors.identifier
                      ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                      : ''
                } caret-black placeholder-gray-400`}
                aria-describedby={validationErrors.identifier ? "identifier-error" : undefined}
                required
                style={{ color: '#111', background: '#fff', caretColor: '#111' }}
              />
              {touched.identifier && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {validationErrors.identifier ? (
                    <FaTimesCircle className="text-red-500" />
                  ) : (
                    <FaCheckCircle className="text-green-500" />
                  )}
                </div>
              )}
            </div>
            {validationErrors.identifier && (
              <p id="identifier-error" className="mt-1 text-sm text-red-600" role="alert">
                {validationErrors.identifier}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block font-semibold text-black mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your password"
                autoComplete="current-password"
                className={`w-full px-4 py-3 rounded-xl border text-base font-medium bg-white border-gray-900 text-black focus:ring-2 focus:ring-[#ff8200] outline-none transition hide-native-reveal ${
                  validationErrors.password
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : touched.password && !validationErrors.password
                      ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                      : ''
                } caret-black placeholder-gray-400`}
                aria-describedby={validationErrors.password ? "password-error" : undefined}
                required
                style={{ WebkitTextSecurity: showPassword ? 'none' : 'disc', color: '#111', background: '#fff', caretColor: '#111' }}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black hover:text-[#ff8200] focus:outline-none transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
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
                className="w-4 h-4 text-[#ff8200] bg-white border-gray-900 rounded focus:ring-[#ff8200] focus:ring-2"
              />
              <span className="ml-2 text-sm text-black">
                Remember me
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-[#ff8200] hover:text-[#e57400] font-semibold transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50/90 border border-red-200 rounded-lg p-3" role="alert">
              <p className="text-red-600 text-sm font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-lg shadow-lg transition duration-300 bg-gradient-to-r from-[#ff8200] to-[#ffb347] text-white hover:from-[#e57400] hover:to-[#ffb347] flex items-center justify-center"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Register Link */}
          <div className="text-center pt-4 border-t border-gray-200/50">
            <p className="text-black text-sm">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="text-[#ff8200] hover:text-[#e57400] font-semibold transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

Login.propTypes = {
  setLoggedInEmail: PropTypes.func,
};

