import axios from "axios";

const API_URL = "http://localhost:3000/products";

export const productService = {
  getProducts: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  createProduct: async (product) => {
    const response = await axios.post(API_URL, product);
    return response.data;
  },

  updateProduct: async (id, product) => {
    const response = await axios.put(`${API_URL}/${id}`, product);
    return response.data;
  },

  deleteProduct: async (id) => {
    await axios.delete(`${API_URL}/${id}`);
  },
};
