import axios from 'axios';

const API_URL = 'http://localhost:3000/auth';
const TOKEN_KEY = 'sessionToken';
const USER_KEY = 'user';

const setAuthHeader = (token) => {
    if (token) {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common.Authorization;
    }
};

const existingToken = localStorage.getItem(TOKEN_KEY);
if (existingToken) {
    setAuthHeader(existingToken);
}

export const authService = {
    login: async (email, pass) => {
        const response = await axios.post(`${API_URL}/login`, { email, pass });
        const token = response.data?.session?.token;
        const user = response.data?.user;

        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
            setAuthHeader(token);
        }

        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }

        return response.data;
    },

    logout: () => {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        setAuthHeader(null);
    },

    getCurrentUser: () => {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    getSessionToken: () => localStorage.getItem(TOKEN_KEY),
};
