import axios from 'axios';

const API_URL = 'https://localhost:5000/api';

export const registerCompany = async (formData) => {
  try {
    // Log the FormData contents for debugging
    for (let pair of formData.entries()) {
      const value = pair[1] instanceof File 
        ? `File: ${pair[1].name} (${pair[1].type})`
        : pair[1];
      console.log(`${pair[0]}: ${value}`);
    }

    const response = await axios.post(`${API_URL}/companies`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      validateStatus: function (status) {
        return status < 500; // Accept all status codes less than 500
      }
    });

    if (response.status === 400) {
      throw new Error(response.data.error || 'Registration failed');
    }

    return response.data;
  } catch (error) {
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

export const loginCompany = async (loginData) => {
  try {
    console.log("Login request with data:", loginData.email);
    const response = await axios.post(`${API_URL}/companies/login`, loginData);
    console.log("Login response:", response.data);
    
    // Store the company type in localStorage
    if (response.data.success) {
      localStorage.setItem('companyType', response.data.type);
      
      // Also store the company data in localStorage for easier access
      localStorage.setItem('companyData', JSON.stringify(response.data.company));
    }
    return response.data;
  } catch (error) {
    console.error('Login error details:', error.response?.data || error);
    if (error.response?.status === 403) {
      throw { error: 'Your company is not approved by Admin yet' };
    } else if (error.response?.status === 401) {
      throw { error: 'Invalid credentials' };
    } else if (error.response?.status === 400) {
      throw { error: error.response.data.error || 'Bad request' };
    } else {
      throw error.response?.data || { error: "An unknown error occurred" };
    }
  }
};

export const createApplication = (applicationData) => {
  return axios.post(`${API_URL}/application`, applicationData);
};

export const getApplicationsByJobId = (jobId, email) => {
  return axios.get(`${API_URL}/application/job/${jobId}`, { data: { email } });
};

export const createJob = async (jobData) => {
  try {
    const response = await axios.post(`${API_URL}/job`, jobData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

export const getJobs = async (filters = {}) => {
  try {
    // Build query parameters
    let queryParams = '';
    if (filters && filters.email) {
      console.log("Adding email filter to jobs query:", filters.email);
      queryParams = `?email=${encodeURIComponent(filters.email)}`;
    }
    
    const requestUrl = `${API_URL}/job${queryParams}`;
    console.log(`Making GET request to: ${requestUrl}`);
    const response = await axios.get(requestUrl);
    
    if (filters && filters.email) {
      console.log(`Received ${response.data.length} jobs for company email: ${filters.email}`);
    } else {
      console.log(`Received ${response.data.length} total jobs`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
};

export const getJobById = async (jobId) => {
  try {
    const response = await axios.get(`${API_URL}/job/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching job:', error);
    throw error;
  }
};

export const getCompanyInfo = async (email) => {
  try {
    if (!email) {
      console.error("No email provided to getCompanyInfo");
      throw new Error("Email is required");
    }
    
    console.log("Fetching company info for email:", email);
    
    // Try to get from localStorage first for better performance
    const cachedCompanyData = localStorage.getItem('companyData');
    if (cachedCompanyData) {
      const parsedData = JSON.parse(cachedCompanyData);
      if (parsedData.email === email) {
        console.log("Using cached company data");
        return parsedData;
      }
    }
    
    // If not in cache, fetch from API
    const response = await axios.get(`${API_URL}/companies/info?email=${encodeURIComponent(email)}`);
    console.log("Company info API response:", response.data);
    
    // Update the cache
    localStorage.setItem('companyData', JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    console.error("Error fetching company details:", error);
    throw error;
  }
};

export const editJob = async (jobId, jobData) => {
  try {
    const response = await axios.put(`${API_URL}/job/${jobId}`, jobData);
    return response.data;
  } catch (error) {
    console.error('Error editing job:', error);
    throw error;
  }
};

export const deleteJob = async (jobId) => {
  try {
    console.log('Deleting job with ID:', jobId); // Log the job ID
    const response = await axios.delete(`${API_URL}/job/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
};

export const getPendingCompanies = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/pending-companies`);
    return response.data;
  } catch (error) {
    console.error('Error getting pending companies:', error);
    throw error;
  }
};

export const approveCompany = async (companyId) => {
  try {
    const response = await axios.post(`${API_URL}/admin/approve-company/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Error approving company:', error);
    throw error;
  }
};

export const denyCompany = async (companyId) => {
  try {
    const response = await axios.post(`${API_URL}/admin/deny-company/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Error denying company:', error);
    throw error;
  }
};

export const adminLogin = async (password) => {
  try {
    const response = await axios.post(`${API_URL}/admin/login`, { password });
    return response.data;
  } catch (error) {
    console.error('Error logging in as admin:', error.response.data.message);
    throw error.response.data;
  }
};

export const updateCompanyProfile = async (email, formData) => {
  try {
    // Log the FormData contents for debugging
    for (let pair of formData.entries()) {
      const value = pair[1] instanceof File 
        ? `File: ${pair[1].name} (${pair[1].type})`
        : pair[1];
      console.log(`${pair[0]}: ${value}`);
    }

    const response = await axios.put(`${API_URL}/companies/update/${email}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      validateStatus: function (status) {
        return status < 500; // Accept all status codes less than 500
      }
    });

    if (response.status === 400) {
      throw new Error(response.data.error || 'Update failed');
    }

    return response.data;
  } catch (error) {
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};