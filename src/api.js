import axios from 'axios';
import { config } from './config/env.js';

const API_URL = config.API_URL;
const AI_API_URL = config.AI_API_URL;

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
  const response = await axios.post(`${API_URL}/companies`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    validateStatus(status) { return status < 500; }
  });
  if (response.status === 400) {
    throw new Error(response.data.error || 'Registration failed');
  }
  return response.data;
};

export const loginCompany = async (loginData) => {
  try {
    
    // Add a pre-flight check to verify CORS is working
    try {
      await axios.get(`${API_URL.replace('/api', '')}/api/cors-test`);
    } catch {
      // Continue with login attempt anyway
    }
    
    // Support username or email via 'identifier'
    const payload = loginData.identifier
      ? loginData
      : (loginData.email ? { identifier: loginData.email, password: loginData.password } : loginData);
  const response = await apiClient.post('/companies/login', payload);
    
    // Store the company type in localStorage
    if (response.data.success) {
      localStorage.setItem('companyType', response.data.type);
      
      // Also store the company data in localStorage for easier access
      localStorage.setItem('companyData', JSON.stringify(response.data.company));
      if (response.data.token) {
        localStorage.setItem('companyToken', response.data.token);
      }
    }
    return response.data;
  } catch (error) {
    if (error.code === 'ERR_NETWORK') {
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
  // If it contains a file, we need to use FormData
  if (applicationData.resume instanceof File) {
    const dataToSend = new FormData();
    // Add all fields to FormData
    Object.keys(applicationData).forEach(key => {
      dataToSend.append(key, applicationData[key]);
    });
    const response = await axios.post(`${API_URL}/application`, dataToSend, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
  // Regular JSON submission (no files)
  const response = await axios.post(`${API_URL}/application`, applicationData);
  return response.data;
};

export const getApplication = async (id, email) => {
  const response = await axios.get(`${API_URL}/application/${id}`, { params: { email } });
  return response.data;
};

export const createJob = async (jobData, options = {}) => {
  const isFormData = typeof FormData !== 'undefined' && jobData instanceof FormData;
  const headers = options.headers || (isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' });
  const response = await axios.post(`${API_URL}/job`, jobData, { headers });
  return response.data;
};

export const getJobs = async (filters = {}) => {
  const queryParams = filters?.email ? `?email=${encodeURIComponent(filters.email)}` : '';
  const requestUrl = `${API_URL}/job${queryParams}`;
  const response = await axios.get(requestUrl);
  return response.data;
};

export const getJobById = async (jobId) => {
  const response = await axios.get(`${API_URL}/job/${jobId}`);
  return response.data;
};

export const getCompanyInfo = async (email) => {
  if (!email) { throw new Error("Email is required"); }
  // Try to get from localStorage first for better performance
  const cachedCompanyData = localStorage.getItem('companyData');
  if (cachedCompanyData) {
    try {
      const parsedData = JSON.parse(cachedCompanyData);
      if (parsedData.email === email) {
        return parsedData;
      }
    } catch {
      // ignore parse errors
    }
  }
  // If not in cache, fetch from API
  const response = await axios.get(`${API_URL}/companies/info?email=${encodeURIComponent(email)}`);
  // Update the cache
  localStorage.setItem('companyData', JSON.stringify(response.data));
  return response.data;
};

// Company messaging (chat-like)
export const getCompanyMessages = async (email, page = 1, limit = 50) => {
  if (!email) throw new Error('Email required');
  const token = localStorage.getItem('companyToken');
  const headers = {};
  if (token) headers['company-auth'] = token;
  const response = await axios.get(`${API_URL}/companies/messages`, { params: { email, page, limit }, headers });
  return response.data;
};

export const sendCompanyMessage = async (email, message) => {
  if (!email || !message) throw new Error('Email and message required');
  const token = localStorage.getItem('companyToken');
  const headers = {};
  if (token) headers['company-auth'] = token;
  const response = await axios.post(`${API_URL}/companies/messages`, { email, message }, { headers });
  return response.data;
};

// Admin messaging helpers
export const getAdminCompanyMessages = async (companyId) => {
  const token = localStorage.getItem('adminToken');
  const response = await axios.get(`${API_URL}/admin/company/${companyId}/messages`, { headers: token ? { 'x-auth-token': token } : undefined });
  return response.data;
};

export const sendAdminCompanyMessage = async (companyId, message) => {
  const token = localStorage.getItem('adminToken');
  const response = await axios.post(`${API_URL}/admin/company/${companyId}/messages`, { message }, { headers: token ? { 'x-auth-token': token } : undefined });
  return response.data;
};

export const editJob = async (jobId, jobData) => {
  const isFormData = typeof FormData !== 'undefined' && jobData instanceof FormData;
  const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
  const response = await axios.put(`${API_URL}/job/${jobId}`, jobData, { headers });
  return response.data;
};

export const deleteJob = async (jobId) => {
  const response = await axios.delete(`${API_URL}/job/${jobId}`);
  return response.data;
};

export const getPendingCompanies = async () => {
  const response = await axios.get(`${API_URL}/admin/pending-companies`);
  return response.data;
};

export const approveCompany = async (companyId) => {
  const token = localStorage.getItem('adminToken');
  const response = await axios.post(`${API_URL}/admin/approve-company/${companyId}`, {}, { headers: token ? { 'x-auth-token': token } : undefined });
  return response.data;
};

export const denyCompany = async (companyId) => {
  const token = localStorage.getItem('adminToken');
  const response = await axios.post(`${API_URL}/admin/deny-company/${companyId}`, {}, {
    headers: token ? { 'x-auth-token': token } : undefined
  });
  return response.data;
};

export const denyCompanyWithReason = async (companyId, reason) => {
  const token = localStorage.getItem('adminToken');
  const response = await axios.post(`${API_URL}/admin/deny-company/${companyId}`, { reason }, {
    headers: token ? { 'x-auth-token': token } : undefined
  });
  return response.data;
};

export const holdCompanyWithReason = async (companyId, reason) => {
  const token = localStorage.getItem('adminToken');
  const response = await axios.post(`${API_URL}/admin/hold-company/${companyId}`, { reason }, {
    headers: token ? { 'x-auth-token': token } : undefined
  });
  return response.data;
};

export const revokeCompanyAccess = async (companyId, reason) => {
  const token = localStorage.getItem('adminToken');
  const response = await axios.post(`${API_URL}/admin/revoke-access/${companyId}`, { reason }, {
    headers: token ? { 'x-auth-token': token } : undefined
  });
  return response.data;
};

export const adminLogin = async (loginData) => {
  try {
    const response = await axios.post(`${API_URL}/admin/login`, loginData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateCompanyProfile = async (email, formData) => {
  const response = await axios.put(`${API_URL}/companies/update/${email}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    validateStatus(status) { return status < 500; }
  });
  if (response.status === 400) {
    throw new Error(response.data.error || 'Update failed');
  }
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
  return response.data;
};

// Verify OTP to obtain a short-lived reset token
export const verifyOtp = async (email, code) => {
  const response = await axios.post(`${API_URL}/auth/verify-otp`, { email, code });
  return response.data;
};

export const resetPassword = async (token, email, password) => {
  const response = await axios.post(`${API_URL}/auth/reset-password`, { token, email, password });
  return response.data;
};

export const changeAdminPassword = async (currentPassword, newPassword) => {
  try {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      throw new Error("No authentication token found. Please login again.");
    }
    
    const response = await axios.post(
      `${API_URL}/admin-management/change-password`,
      { currentPassword, newPassword },
      {
        headers: {
          "x-auth-token": token
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getApplicationsByJobId = async (jobId) => {
  try {
    // Get email from localStorage for authentication
    let email = localStorage.getItem("rememberedEmail");
    if (!email) {
      // Fallback to companyData if available
      try {
        const cd = JSON.parse(localStorage.getItem("companyData") || "null");
        if (cd?.email) email = cd.email;
      } catch { /* ignore */ }
    }
    
  if (!email) { throw new Error('Authentication required to view applications'); }
    
    
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
            email
          }
        });
        
        // If we got a response, break out of retry loop
        break;
  } catch (requestError) {
        retries++;
        
        // If we've used all retries, throw the error
        if (retries > maxRetries) throw requestError;
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
    
  if (!Array.isArray(response?.data)) {
      // Convert to array if needed
      response.data = Array.isArray(response?.data) ? response.data : [];
    }
    
    return response.data;
  } catch (error) {
    
    // More helpful error message based on error type
    if (error.response?.status === 400) {
      // Authentication error
    } else if (error.response?.status === 403) {
      // Permission denied
    }
    
    // Return empty array instead of throwing to avoid UI errors
    return [];
  }
};

// Get all applications for a company by email (aggregated)
export const getApplicationsForCompany = async (email) => {
  if (!email) throw new Error('Email is required');
  const response = await axios.get(`${API_URL}/application/company`, {
    headers: { 'company-email': email },
    params: { email },
  });
  return response.data;
};

// Application status updates
export const shortlistApplication = async (applicationId) => {
  const email = localStorage.getItem('rememberedEmail') || (JSON.parse(localStorage.getItem('companyData') || 'null')?.email || undefined);
  const response = await axios.post(`${API_URL}/application/${applicationId}/shortlist`, {}, { headers: email ? { 'company-email': email } : undefined });
  return response.data;
};

export const rejectApplication = async (applicationId) => {
  const email = localStorage.getItem('rememberedEmail') || (JSON.parse(localStorage.getItem('companyData') || 'null')?.email || undefined);
  const response = await axios.post(`${API_URL}/application/${applicationId}/reject`, {}, { headers: email ? { 'company-email': email } : undefined });
  return response.data;
};

// AI recommendations for a job
export const getRecommendationsForJob = async (jobId, topN = 5) => {
  const response = await axios.get(`${AI_API_URL}/recommend`, {
    params: { job_id: jobId, top_n: topN },
    withCredentials: false
  });
  const recs = response.data?.recommendations || [];
  // Normalize to always include .name for UI
  return recs.map(r => ({
    ...r,
    name: r.applicantName || r.name || 'N/A'
  }));
};

export async function registerBasic(data) {
  const res = await fetch(`${API_URL}/auth/register-basic`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || 'Register failed');
  return j;
}

export async function verifySignupOtp(email, code) {
  const res = await fetch(`${API_URL}/auth/verify-signup-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || 'Verification failed');
  return j;
}

export async function resendSignupOtp(email) {
  const res = await fetch(`${API_URL}/auth/resend-signup-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || 'Resend failed');
  return j;
}

export async function chooseSubscription(email, plan) {
  const res = await fetch(`${API_URL}/company/subscription/choose`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, plan }) });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || 'Subscription failed');
  return j;
}

export async function completeProfile(formData) {
  const res = await fetch(`${API_URL}/company/profile/complete`, { method: 'POST', body: formData });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || 'Profile update failed');
  return j;
}
