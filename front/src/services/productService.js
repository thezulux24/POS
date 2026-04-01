import axios from 'axios';

const API_URL = 'http://localhost:3000/products';

export const productService = {
    search: async (query, limit = 20) => {
        const response = await axios.get(`${API_URL}/search`, {
            params: { q: query, limit },
        });
        return response.data;
    },
    list: async (filters = {}) => {
        const response = await axios.get(API_URL, { params: filters });
        return response.data;
    },
    create: async (payload) => {
        const response = await axios.post(API_URL, payload);
        return response.data;
    },
    update: async (id, payload) => {
        const response = await axios.patch(`${API_URL}/${id}`, payload);
        return response.data;
    },
    remove: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    },
};
