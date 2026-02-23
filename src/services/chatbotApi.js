import axios from "axios";

const API_URL = "http://localhost:8000";

export const sendMessage = (message) => {
  return axios.post(`${API_URL}/chat`, { message });
};