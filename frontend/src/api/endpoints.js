import api from './axios';

export const authApi = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const documentsApi = {
  getAll: async () => {
    const response = await api.get('/documents');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  upload: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      }
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
getFile: (id) => {
    // Notice the .replace() added to the very end of this next line!
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
    const token = localStorage.getItem('token');
    return `${baseUrl}/documents/${id}/file?token=${token}`;
  },
chat: async (id, message) => {
  const response = await api.post(`/documents/${id}/chat`, { message });
  return response.data;
}
};

export const analyticsApi = {
  get: async () => {
    const response = await api.get('/analytics');
    return response.data;
  }
};