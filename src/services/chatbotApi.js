import axios from "axios";
import { config } from "../config/env";

export const sendMessage = (message) => {
  return axios.post(`${config.API_URL}/ai/chat`, { message });
};