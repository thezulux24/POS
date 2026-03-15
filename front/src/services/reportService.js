import axios from 'axios';

const API_URL = 'http://localhost:3000/reports';

const getAuthHeader = () => {
  const token = localStorage.getItem('sessionToken');
  return token ? { 'session-token': token } : {};
};

export const reportService = {
  getStats: async () => {
    const response = await axios.get(`${API_URL}/dashboard/stats`, { headers: getAuthHeader() });
    return response.data;
  },
  getSalesOverTime: async (days = 7) => {
    const response = await axios.get(`${API_URL}/dashboard/sales-over-time`, { 
      params: { days },
      headers: getAuthHeader() 
    });
    return response.data;
  },
  getTopProducts: async (limit = 5) => {
    const response = await axios.get(`${API_URL}/dashboard/top-products`, { 
      params: { limit },
      headers: getAuthHeader() 
    });
    return response.data;
  },
  getDetailedReport: async (startDate, endDate) => {
    const response = await axios.get(`${API_URL}/detailed`, {
      params: { startDate, endDate },
      headers: getAuthHeader()
    });
    return response.data;
  },
};
