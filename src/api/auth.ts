import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://api.inkpulse.com/api/v1';

export const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send HttpOnly Cookie in cross-origin requests
});

// In-Memory Access Token Storage
let accessTokenMemory: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessTokenMemory = token;
};

export const getAccessToken = () => {
  return accessTokenMemory;
};

// Add request interceptor to attach Bearer Access Token
authClient.interceptors.request.use(
  (config) => {
    if (accessTokenMemory) {
      config.headers.Authorization = `Bearer ${accessTokenMemory}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];
let activeRefreshPromise: Promise<string | null> | null = null;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const refreshSession = async (): Promise<string | null> => {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
      if (res.data && res.data.success && res.data.data) {
        const token = res.data.data.accessToken;
        setAccessToken(token);
        return token;
      }
    } catch (err) {
      console.error('Silent refresh failed on session init:', err);
    } finally {
      activeRefreshPromise = null;
    }
    return null;
  })();

  return activeRefreshPromise;
};

authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh' &&
      originalRequest.url !== '/auth/internal/login'
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            originalRequest._retry = true;
            return authClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshSession();
        if (!newAccessToken) {
          throw new Error('Refresh session returned empty token');
        }

        authClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return authClient(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        isRefreshing = false;

        if (refreshError.response?.status === 403 || refreshError.response?.status === 401) {
          logOutClient();
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const logOutClient = () => {
  setAccessToken(null);
  window.location.reload();
};

export const internalLoginApi = (loginData: any) => {
  return authClient.post('/auth/internal/login', loginData);
};

export const logoutApi = () => {
  return authClient.post('/auth/logout', {});
};
