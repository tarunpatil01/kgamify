import axios from 'axios';

const API_URL = 'https://job-portal-backend-629b.onrender.com/api';

// Create a custom axios instance with default settings
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Include credentials in cross-origin requests
});

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
    
    // Add a pre-flight check to verify CORS is working
    try {
      const corsTest = await axios.get(`${API_URL.replace('/api', '')}/api/cors-test`);
      console.log("CORS test successful:", corsTest.data);
    } catch (corsError) {
      console.warn("CORS test failed:", corsError.message);
      // Continue with login attempt anyway
    }
    
    const response = await apiClient.post('/companies/login', loginData);
    console.log("Login response:", response.data);
    
    // Store the company type in localStorage
    if (response.data.success) {
      localStorage.setItem('companyType', response.data.type);
      
      // Also store the company data in localStorage for easier access
      localStorage.setItem('companyData', JSON.stringify(response.data.company));
    }
    return response.data;
  } catch (error) {
    // Improve error logging with more details
    console.error('Login error details:', error);
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - possible CORS issue or server unavailable');
      throw { error: 'Network error. Please check your connection or try again later.' };
    }
    
    // Continue with existing error handling
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

export const createApplication = async (applicationData) => {
  try {
    // Check if applicationData is FormData or regular object
    let dataToSend;
    
    // If it contains a file, we need to use FormData
    if (applicationData.resume instanceof File) {
      dataToSend = new FormData();
      
      // Add all fields to FormData
      Object.keys(applicationData).forEach(key => {
        dataToSend.append(key, applicationData[key]);
      });
      
      // Log the FormData contents for debugging
      for (let pair of dataToSend.entries()) {
        const value = pair[1] instanceof File 
          ? `File: ${pair[1].name} (${pair[1].type})`
          : pair[1];
        console.log(`${pair[0]}: ${value}`);
      }
      
      const response = await axios.post(`${API_URL}/application`, dataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } else {
      // Regular JSON submission (no files)
      const response = await axios.post(`${API_URL}/application`, applicationData);
      return response.data;
    }
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
};

export const getApplication = async (id, email) => {
  try {
    const response = await axios.get(`${API_URL}/application/${id}`, {
      params: { email }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching application:', error);
    throw error;
  }
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

export const adminLogin = async (loginData) => {
  try {
    const response = await axios.post(`${API_URL}/admin/login`, loginData);
    return response.data;
  } catch (error) {
    console.error('Error logging in as admin:', error.response?.data?.message || error.message);
    throw error.response?.data || error;
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

export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return response.data;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw error.response?.data || error;
  }
};

export const resetPassword = async (token, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password`, { 
      token, 
      email, 
      password 
    });
    return response.data;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error.response?.data || error;
  }
};

export const getApplicationsByJobId = async (jobId) => {
  try {
    // Get email from localStorage for authentication
    const email = localStorage.getItem("rememberedEmail");
    
    if (!email) {
      console.error('No authentication email found in localStorage');
      throw new Error('Authentication required to view applications');
    }
    
    console.log(`Fetching applications for job ID: ${jobId} with auth email: ${email}`);
    
    // Add email to both headers and query params to ensure it's properly sent
    // Add retry logic in case of initial failure
    let retries = 0;
    const maxRetries = 2;
    let response;
    
    while (retries <= maxRetries) {
      try {
        response = await axios.get(`${API_URL}/application/job/${jobId}`, {
          headers: {
            'company-email': email,
            'Authorization': `Bearer ${localStorage.getItem("token") || ""}`
          },
          params: {
            email: email
          }
        });
        
        // If we got a response, break out of retry loop
        break;
      } catch (requestError) {
        console.warn(`Attempt ${retries + 1} failed:`, requestError.message);
        retries++;
        
        // If we've used all retries, throw the error
        if (retries > maxRetries) throw requestError;
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
    
    if (Array.isArray(response.data)) {
      console.log(`Successfully retrieved ${response.data.length} applications`);
    } else {
      console.warn('Response is not an array:', response.data);
      // Convert to array if needed
      response.data = Array.isArray(response.data) ? response.data : [];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching applications for job:', error);
    
    // More helpful error message based on error type
    if (error.response?.status === 400) {
      console.error('Authentication error:', error.response?.data);
    } else if (error.response?.status === 403) {
      console.error('Permission denied:', error.response?.data);
    }
    
    // Return empty array instead of throwing to avoid UI errors
    return [];
  }
};
