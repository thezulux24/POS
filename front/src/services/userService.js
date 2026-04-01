import axios from 'axios';

const API_URL = 'http://localhost:3000/users';

const getAuthHeader = () => {
  const token = localStorage.getItem('sessionToken');
  return token ? { 'session-token': token } : {};
};

export const userService = {
  list: async () => {
    const response = await axios.get(API_URL, { headers: getAuthHeader() });
    return response.data;
  },
  getById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`, { headers: getAuthHeader() });
    return response.data;
  },
  create: async (payload) => {
    const response = await axios.post(API_URL, payload, { headers: getAuthHeader() });
    return response.data;
  },
  update: async (id, payload) => {
    const response = await axios.patch(`${API_URL}/${id}`, payload, { headers: getAuthHeader() });
    return response.data;
  },
  delete: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
    return response.data;
  },
};
