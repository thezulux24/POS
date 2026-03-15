import axios from 'axios';

const API_URL = 'http://localhost:3000/customers';

export const customerService = {
  search: async (query) => {
    const response = await axios.get(API_URL, {
      params: { search: query },
    });
    return response.data;
  },
};
