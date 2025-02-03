import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import backgroundImage from "./assets/background.jpg";
import Register from "./Register";
import Dashboard from "./Dashboard";

function Login() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div
      className="flex justify-center items-center h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="bg-white bg-opacity-90 p-8 rounded shadow-md w-full max-w-md">
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
