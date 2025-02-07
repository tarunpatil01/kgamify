import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Register() {
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/dashboard");
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div className="flex p-12 justify-center items-center h-full bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-3xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
          Company Registration
        </h1>
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">
              Basic Info
            </h2>
            <div className="mb-6 flex gap-x-4">
              <div className="w-1/2">
                <label className="block text-gray-700">Company Name</label>
                <input
                  type="text"
                  className="w-full p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700">Logo</label>
                <input
                  type="file"
                  className="w-full p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
            <div className="mb-6 flex gap-x-4">
              <div className="w-1/2">
                <label className="block text-gray-700">Website</label>
                <input
                  type="url"
                  className="w-full p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700">Industry</label>
                <input
                  type="text"
                  className="w-full p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
            <div className="mb-6 flex gap-x-4">
              <div className="w-1/2">
                <label className="block text-gray-700">Type</label>
                <input
                  type="text"
                  className="w-full p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700">Size</label>
                <input
                  type="text"
                  className="w-full p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">
              Contact
            </h2>
            <div className="mb-6 flex gap-x-4">
              <div className="w-1/2">
                <label className="block text-gray-700">Contact Name</label>
                <input
                  type="text"
                  className="w-full p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  className="w-full p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
            <div className="mb-6 flex gap-x-4">
              <div className="w-1/2">
                <label className="block text-gray-700">Phone</label>
                <input
                  type="tel"
                  className="w-full p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700">Address</label>
                <input
                  type="text"
                  className="w-full p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">
              Registration
            </h2>
            <div className="mb-6 flex gap-x-4">
              <div className="w-1/2">
                <label className="block text-gray-700">Registration Number</label>
                <input
                  type="text"
                  className="w-full p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-gray-700">Year Established</label>
                <input
                  type="number"
                  className="w-full p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700">Documents</label>
              <input
                type="file"
                className="w-full p-4 border border-gray-300 rounded mt-2"
              />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">Password</h2>
            <div className="mb-6 relative">
              <label className="block text-gray-700">Password</label>
              <input
                type={passwordVisible ? "text" : "password"}
                className="w-full p-4 border border-gray-300 rounded mt-2"
                pattern="(?=.\d)(?=.[a-z])(?=.*[A-Z]).{8,}"
                title="Must contain at least one number, one uppercase and lowercase letter, and at least 8 or more characters"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Password must contain at least one number, one uppercase and lowercase letter, and at least 8 or more characters.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">Other</h2>
            <div className="mb-6">
              <label className="block text-gray-700">Description</label>
              <textarea className="w-full p-4 border border-gray-300 rounded mt-2"></textarea>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700">Social Media Links</label>
              <input
                type="url"
                className="w-full p-4 border border-gray-300 rounded mt-2"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-[#E82561] text-white p-4 rounded hover:bg-[#d71e55] transition duration-300"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;