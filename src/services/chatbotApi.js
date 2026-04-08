import axios from "axios";
import { API_URL } from "../config/env";

export const sendMessage = (message) => {
  return axios.post(`${API_URL}/ai/chat`, { message });
};