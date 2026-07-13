import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Auto-attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Auto-logout if token expires (BUT ignore login attempts)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the request that failed was the login endpoint
    const originalRequest = error.config;
    const isLoginRequest = originalRequest && originalRequest.url && originalRequest.url.includes('/auth/login');

    // Only force a hard-refresh if it's a 401 AND they aren't actively trying to log in
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;