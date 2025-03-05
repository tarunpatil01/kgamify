import React, { useState, useEffect } from "react";
import { FaEdit } from "react-icons/fa";
import { getCompanyInfo } from "../api"; // Import the new function

function EditRegistration({ isDarkMode }) {
  const [companyDetails, setCompanyDetails] = useState({
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

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const data = await getCompanyInfo("67b725dd2f143dd55cb8ae04"); // Use the correct company ID
        setCompanyDetails(data);
      } catch (error) {
        console.error("Error fetching company details:", error);
      }
    };

    fetchCompanyDetails();
  }, []);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setCompanyDetails((prevDetails) => ({
      ...prevDetails,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Mock function to save company details
    console.log("Company details updated:", companyDetails);
    alert("Company details updated successfully!");
  };

  return (
    <div className={`flex p-4 sm:p-12 justify-center items-center h-full ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className={`p-4 sm:p-8 rounded-2xl shadow-lg w-full max-w-3xl ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
        <h1 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-8 text-center">Company Registration</h1>
        <form className="space-y-4 sm:space-y-8" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Basic Info</h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4 items-center">
              <div className="w-full sm:w-1/2">
                <label className="block">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={companyDetails.companyName}
                  readOnly
                  className={`w-full p-2 sm:p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                />
              </div>
              <div className="w-full sm:w-1/2 flex items-center">
                <label className="block pr-2">Logo</label>
                <input
                  type="file"
                  name="logo"
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300 text-black"}`}
                />
                <FaEdit className="ml-2 text-gray-500" />
              </div>
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4 items-center">
              <div className="w-full sm:w-1/2 flex items-center">
                <label className="block pr-2">Website</label>
                <input
                  type="url"
                  name="website"
                  value={companyDetails.website}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300 text-black"}`}
                />
                <FaEdit className="ml-2 text-gray-500" />
              </div>
              <div className="w-full sm:w-1/2 flex items-center">
                <label className="block pr-2">Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={companyDetails.industry}
                  readOnly
                  className={`w-full p-2 sm:p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                />
              </div>
            </div>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4 items-center">
              <div className="w-full sm:w-1/2 flex items-center">
                <label className="block pr-2">Type</label>
                <input
                  type="text"
                  name="type"
                  value={companyDetails.type}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300 text-black"}`}
                />
                <FaEdit className="ml-2 text-gray-500" />
              </div>
              <div className="w-full sm:w-1/2 flex items-center">
                <label className="block pr-2">Size</label>
                <input
                  type="text"
                  name="size"
                  value={companyDetails.size}
                  onChange={handleChange}
                  className={`w-full p-2 sm:p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300 text-black"}`}
                />
                <FaEdit className="ml-2 text-gray-500" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Contact</h2>
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-x-4 items-center">
              <div className="w-full sm:w-1/2 flex items-center">
                <label className="block">Contact Name</label>
                <input
                  type="text"
                  name="contactName"
                  value={companyDetails.contactName}
                  onChange={handleChange}
                  className={`w-full p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300 text-black"}`}
                />
                <FaEdit className="ml-2 text-gray-500" />
              </div>
              <div className="w-1/2 flex items-center">
                <label className="block pr-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={companyDetails.email}
                  onChange={handleChange}
                  className={`w-full p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300 text-black"}`}
                />
                <FaEdit className="ml-2 text-gray-500" />
              </div>
            </div>
            <div className="mb-6 flex gap-x-4 items-center">
              <div className="w-1/2 flex items-center">
                <label className="block pr-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={companyDetails.phone}
                  onChange={handleChange}
                  className={`w-full p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300 text-black"}`}
                />
                <FaEdit className="ml-2 text-gray-500" />
              </div>
              <div className="w-1/2 flex items-center">
                <label className="block pr-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={companyDetails.address}
                  onChange={handleChange}
                  className={`w-full p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300 text-black"}`}
                />
                <FaEdit className="ml-2 text-gray-500" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-6">Registration</h2>
            <div className="mb-6 flex gap-x-4">
              <div className="w-1/2">
                <label className="block">Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={companyDetails.registrationNumber}
                  readOnly
                  className={`w-full p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                />
              </div>
              <div className="w-1/2">
                <label className="block">Year Established</label>
                <input
                  type="number"
                  name="yearEstablished"
                  value={companyDetails.yearEstablished}
                  readOnly
                  className={`w-full p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-black"}`}
                />
              </div>
            </div>
            <div className="mb-6 flex items-center">
              <label className="block pr-2">Documents</label>
              <input
                type="file"
                name="documents"
                onChange={handleChange}
                className={`w-full p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300 text-black"}`}
              />
              <FaEdit className="ml-2 text-gray-500" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-6">Other</h2>
            <div className="mb-6 flex items-center">
              <label className="block pr-2">Description</label>
              <textarea
                name="description"
                value={companyDetails.description}
                onChange={handleChange}
                className={`w-full p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300 text-black"}`}
              ></textarea>
              <FaEdit className="ml-2 text-gray-500" />
            </div>
            <div className="mb-6 flex items-center">
              <label className="block">Social Media Links</label>
              <input
                type="url"
                name="socialMediaLinks"
                value={companyDetails.socialMediaLinks}
                onChange={handleChange}
                className={`w-full p-4 border rounded mt-2 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300 text-black"}`}
              />
              <FaEdit className="ml-2 text-gray-500" />
            </div>
          </div>
          <button
            type="submit"
            className={`w-full p-4 rounded transition duration-300 ${isDarkMode ? "bg-[#E82561] text-white hover:bg-[#d71e55]" : "bg-[#E82561] text-white hover:bg-[#d71e55]"}`}
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditRegistration;