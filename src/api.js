import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const registerCompany = async (companyData) => {
  try {
    const response = await axios.post(`${API_URL}/company/register`, companyData);
    return response.data;
  } catch (error) {
    console.error('Error registering company:', error);
    throw error;
  }
};

export const loginCompany = async (loginData) => {
  try {
    const response = await axios.post(`${API_URL}/company/login`, loginData);
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error.response.data.error);
    throw error.response.data;
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
    const response = await axios.post(`${API_URL}/job`, jobData);
    return response.data;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

export const getJobs = async () => {
  try {
    const response = await axios.get(`${API_URL}/job`);
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

export const getCompanyInfo = async (companyId) => {
  try {
    const response = await axios.get(`${API_URL}/company/${companyId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching company details:", error);
    throw error;
  }
};