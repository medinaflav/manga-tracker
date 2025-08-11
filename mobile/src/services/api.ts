const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) throw new Error('Network error');
  return res.json();
};
