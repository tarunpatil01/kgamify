import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import backgroundImage from "./assets/background.jpg";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PostJob from "./pages/PostJob";
import JobPosted from "./pages/JobPosted";
import Job from "./JobApplications/job"; // Add this import
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { useState, useEffect } from "react";

function Login() {  
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/dashboard");
  };

  useEffect(() => {
    const img = new Image();
    img.src = backgroundImage;
  }, []);

  return (
    <div
      className="flex justify-center items-center h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-md w-full max-w-md">
        <img
          src="src/assets/KLOGO.png"
          alt="Kgamify Logo"
          className="mx-auto mb-6 w-32 h-32 object-contain"
        />
        <h1 className="text-3xl font-bold mb-6 text-center">Welcome to Kgamify</h1>
        <p className="mb-6 text-center">Post Job, View Application ....</p>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700">Email ID</label>
            <input
              type="email"
              placeholder="Enter your Email ID"
              className="w-full p-3 border border-gray-300 rounded mt-1"
            />
          </div>
          <div>
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Enter your Password"
              className="w-full p-3 border border-gray-300 rounded mt-1"
            />
          </div>
          <div className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <label className="text-gray-700">Remember Me</label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition duration-300"
          >
            Login Now
          </button>
        </form>
        <div className="mt-6 text-center">
          <a href="#" className="text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>
        <div className="mt-6 text-center">
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
}

function AppContent() {
  const location = useLocation();
  const showNavbar = location.pathname !== "/" && location.pathname !== "/register";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`flex ${isDarkMode ? "dark" : ""}`}>
      {showNavbar && <Sidebar onToggle={setIsSidebarOpen} onThemeToggle={handleThemeToggle} isDarkMode={isDarkMode} />}
      <div className="flex-grow">
        {showNavbar && <Navbar isSidebarOpen={isSidebarOpen} onThemeToggle={handleThemeToggle} isDarkMode={isDarkMode} />}
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/post-job" element={<PostJob />} />
          <Route path="/job-posted" element={<JobPosted />} />
          <Route path="/job/:jobId" element={<Job />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;