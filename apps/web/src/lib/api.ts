import axios, { type AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('buta_at', token);
    else localStorage.removeItem('buta_at');
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('buta_at');
  }
  return accessToken;
}

export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/v1`,
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((cfg) => {
  const t = getAccessToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        refreshing ??= refreshAccessToken();
        const newToken = await refreshing;
        refreshing = null;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        refreshing = null;
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  },
);

async function refreshAccessToken(): Promise<string> {
  const { data } = await axios.post(
    `${API_URL}/v1/auth/refresh`,
    {},
    { withCredentials: true },
  );
  setAccessToken(data.accessToken);
  return data.accessToken;
}
