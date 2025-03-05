import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerCompany } from "../api";

function GoogleRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    logo: null,
    website: "",
    industry: "",
    type: "",
    size: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    registrationNumber: "",
    yearEstablished: "",
    documents: null,
    description: "",
    socialMediaLinks: "",
  });

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setFormData((prevDetails) => ({
      ...prevDetails,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await registerCompany(formData);
      console.log('Company registered successfully:', response);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error registering company:", error);
    }
  };

  return (
    <div className="flex p-4 sm:p-12 justify-center items-center h-full bg-gray-100">
      <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-lg w-full max-w-3xl">
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8 text-center text-gray-800">
          Company Registration
        </h1>
        <form className="space-y-4 sm:space-y-8" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-700">
              Basic Info
            </h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Logo</label>
                <input
                  type="file"
                  name="logo"
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Type</label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Size</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-700">
              Contact
            </h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Contact Name</label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-700">
              Registration
            </h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
              <div className="w-full sm:w-1/2">
                <label className="block text-gray-700">Year Established</label>
                <input
                  type="number"
                  name="yearEstablished"
                  value={formData.yearEstablished}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700">Documents</label>
              <input
                type="file"
                name="documents"
                onChange={handleChange}
                className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
              />
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-700">Other</h2>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
              ></textarea>
            </div>
            <div className="mb-4 sm:mb-6">
              <label className="block text-gray-700">Social Media Links</label>
              <input
                type="url"
                name="socialMediaLinks"
                value={formData.socialMediaLinks}
                onChange={handleChange}
                className="w-full p-2 sm:p-4 border border-gray-300 rounded mt-2"
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

export default GoogleRegister;