import axios from 'axios';

const API_URL = 'http://localhost:3000/auth';

export const authService = {
    login: async (email, pass) => {
        const response = await axios.post(`${API_URL}/login`, { email, pass });
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
};
