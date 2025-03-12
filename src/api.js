import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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

export const registerGoogleCompany = async (formData) => {
  try {
    for (let pair of formData.entries()) {
      const value = pair[1] instanceof File 
        ? `File: ${pair[1].name} (${pair[1].type})`
        : pair[1];
      console.log(`${pair[0]}: ${value}`);
    }

    const response = await axios.post(`${API_URL}/companies/google`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      validateStatus: function (status) {
        return status < 500;
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
    const response = await axios.post(`${API_URL}/companies/login`, loginData);
    // Store the company type in localStorage
    if (response.data.success) {
      localStorage.setItem('companyType', response.data.type);
    }
    return response.data;
  } catch (error) {
    console.error('Error details:', error.response?.data || error);
    if (error.response?.status === 403) {
      throw { error: 'Your company is not approved by Admin yet' };
    } else if (error.response?.status === 401) {
      throw { error: 'Invalid credentials' };
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
    if (filters.email) {
      queryParams = `?email=${encodeURIComponent(filters.email)}`;
    }
    
    const response = await axios.get(`${API_URL}/job${queryParams}`);
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
    console.log("Fetching company info for email:", email);
    // Try to fetch from both Company and GoogleCompany collections
    const response = await axios.get(`${API_URL}/companies/info?email=${email}`);
    console.log("Company info response:", response.data);
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