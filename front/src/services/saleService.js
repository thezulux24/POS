import axios from 'axios';

const API_URL = 'http://localhost:3000/sales';

export const saleService = {
  create: async (payload) => {
    const response = await axios.post(API_URL, payload);
    return response.data;
  },
  getTicket: async (saleId) => {
    const response = await axios.get(`${API_URL}/${saleId}/ticket`);
    return response.data;
  },
  getDailyReport: async ({ date, vendedorId } = {}) => {
    const params = {};

    if (date) {
      params.date = date;
    }

    if (vendedorId) {
      params.vendedorId = vendedorId;
    }

    const response = await axios.get(`${API_URL}/reports/daily`, { params });
    return response.data;
  },
  getReportVendors: async () => {
    const response = await axios.get(`${API_URL}/reports/vendors`);
    return response.data;
  },
};
