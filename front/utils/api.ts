import axios from 'axios';

/** Base URL for backend API */
export const API_URL = "http://localhost:3000";

/** Preconfigured axios instance for the backend API */
export const api = axios.create({
  baseURL: API_URL,
});
