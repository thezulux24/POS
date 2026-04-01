import axios from 'axios';

const API_URL = 'http://localhost:3000/customers';

const getAuthHeader = () => {
  const token = localStorage.getItem('sessionToken');
  return token ? { 'session-token': token } : {};
};

export const customerService = {
  /**
   * Buscar clientes por nombre o teléfono
   */
  async search(searchTerm) {
    const response = await axios.get(API_URL, {
      params: { search: searchTerm, includeInactive: 'false' },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  /**
   * Obtener todos los clientes activos
   */
  async getAll() {
    const response = await axios.get(API_URL, {
      params: { includeInactive: 'false' },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  /**
   * Obtener un cliente por ID
   */
  async getById(id) {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  /**
   * Crear un nuevo cliente
   */
  async create(customerData) {
    const response = await axios.post(API_URL, customerData, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  /**
   * Actualizar un cliente existente
   */
  async update(id, customerData) {
    const response = await axios.patch(`${API_URL}/${id}`, customerData, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  /**
   * Eliminar un cliente (soft delete)
   */
  async delete(id) {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
