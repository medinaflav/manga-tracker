import axios from 'axios';
import Constants from 'expo-constants';

/**
 * Determine the backend base URL.
 *
 * When running the Expo app on a physical device, "localhost" does not
 * resolve to the development machine. We expose `EXPO_PUBLIC_API_URL` so the
 * URL can be configured at runtime (e.g. via `--env`) and fall back to
 * `Constants.expoConfig.extra.API_URL` if provided. If none is defined we use
 * `http://localhost:3000` as a sensible default.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.API_URL ||
  'http://localhost:3000';

/** Preconfigured axios instance for the backend API */
export const api = axios.create({
  baseURL: API_URL,
});
