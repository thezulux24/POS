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
  getByCustomer: async (customerId) => {
    const response = await axios.get(`${API_URL}/by-customer/${customerId}`);
    return response.data;
  },
};
