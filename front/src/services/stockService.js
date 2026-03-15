import axios from 'axios';

const API_URL = 'http://localhost:3000/stock';

const getAuthHeader = () => {
  const token = localStorage.getItem('sessionToken');
  return token ? { 'session-token': token } : {};
};

export const stockService = {
  adjust: async (productId, cantidad, motivo) => {
    const response = await axios.post(`${API_URL}/adjust`, { productId, cantidad, motivo }, {
      headers: getAuthHeader()
    });
    return response.data;
  },
  getMovements: async (productId) => {
    const response = await axios.get(`${API_URL}/movements`, {
      params: { productId },
      headers: getAuthHeader()
    });
    return response.data;
  }
};
