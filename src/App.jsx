import { useState } from "react";
import "./App.css";

function App() {
  return (
    <>
      <div className="flex justify-center items-center h-screen">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4">Welcome to Kgamify</h1>
          <p className="mb-4">Post Job, View Application ....</p>
          <form>
            <div className="mb-4">
              <label className="block text-gray-700">Email ID</label>
              <input
                type="email"
                placeholder="Enter your Email ID"
                className="w-full p-2 border border-gray-300 rounded mt-1"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Password</label>
              <input
                type="password"
                placeholder="Enter your Password"
                className="w-full p-2 border border-gray-300 rounded mt-1"
              />
            </div>
            <div className="mb-4 flex items-center">
              <input type="checkbox" className="mr-2" />
              <label className="text-gray-700">Remember Me</label>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded"
            >
              Login Now
            </button>
          </form>
          <div className="mt-4 text-center">
            <a href="#" className="text-blue-500">
              Forgot password?
            </a>
          </div>
          <div className="mt-4 text-center">
            <p>
              Not Registered Yet?{" "}
              <a href="#" className="text-blue-500">
                Register now
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
