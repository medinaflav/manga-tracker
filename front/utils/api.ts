import axios from 'axios';
import { Platform } from 'react-native';

/**
 * Determine the backend base URL dynamically.
 * 
 * This function tries multiple approaches to find the correct backend URL:
 * 1. First tries to use EXPO_PUBLIC_API_URL if defined
 * 2. Then tries to detect the local network IP automatically
 * 3. Falls back to localhost for web/simulator
 * 4. Finally falls back to a default IP if nothing else works
 */
const getBackendURL = (): string => {
  // 1. Check for environment variable first
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. For web platform, use localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  // 3. For iOS simulator, use localhost
  if (Platform.OS === 'ios' && __DEV__) {
    return 'http://localhost:3000';
  }

  // 4. For Android emulator, use 10.0.2.2
  if (Platform.OS === 'android' && __DEV__) {
    return 'http://10.0.2.2:3000';
  }

  // 5. For physical devices, use the network IP
  return 'http://192.168.1.83:3000';
};

// Dynamic API URL detection
let API_URL = getBackendURL();

// Function to update API URL (useful for network changes)
export const updateAPIURL = (newURL: string) => {
  API_URL = newURL;
  api.defaults.baseURL = newURL;
};

// Function to test and find the correct backend URL
export const detectBackendURL = async (): Promise<string> => {
  // For now, just test the network IP for physical devices
  const possibleURLs = Platform.OS === 'web' ? [
    'http://localhost:3000',
  ] : Platform.OS === 'ios' && __DEV__ ? [
    'http://localhost:3000',
  ] : Platform.OS === 'android' && __DEV__ ? [
    'http://10.0.2.2:3000',
  ] : [
    // For physical devices, just use the network IP
    'http://192.168.1.83:3000',
  ];

  console.log(`🔍 Testing backend URLs in order:`, possibleURLs);
  
  for (const url of possibleURLs) {
    try {
      console.log(`🔍 Testing: ${url}`);
      const response = await axios.get(`${url}/health`, { timeout: 2000 });
      if (response.status === 200) {
        console.log(`✅ Backend found at: ${url}`);
        updateAPIURL(url);
        return url;
      }
    } catch (error: any) {
      console.log(`❌ Backend not found at: ${url} - ${error.message}`);
    }
  }

  console.warn('⚠️ No backend found, using fallback URL');
  return API_URL;
};

/** Preconfigured axios instance for the backend API */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add request interceptor to handle network errors
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle network errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Only retry once to avoid infinite loops
    if (!error.config._retry && (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error'))) {
      error.config._retry = true;
      console.warn('🌐 Network error detected, trying to detect backend URL...');
      try {
        await detectBackendURL();
        // Retry the original request with the new URL
        const originalRequest = error.config;
        return api.request(originalRequest);
      } catch (detectionError) {
        console.error('❌ Failed to detect backend URL:', detectionError);
      }
    }
    return Promise.reject(error);
  }
);

export { API_URL };
