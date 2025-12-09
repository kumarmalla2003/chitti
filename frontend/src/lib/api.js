import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Trigger logout or redirect
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);

export const verifyPhone = async (phoneNumber) => {
    try {
        const response = await api.post('/auth/verify-phone', { phone_number: phoneNumber });
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw new Error("This phone number is not authorized.");
        }
        throw error;
    }
};

export const login = async (phoneNumber, pin) => {
    const formData = new URLSearchParams();
    formData.append("username", phoneNumber);
    formData.append("password", pin);

    try {
        const response = await api.post('/auth/token', formData, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            if (error.response.status === 401) {
                throw new Error("The PIN you entered is incorrect.");
            }
            if (error.response.status === 404) {
                throw new Error("This phone number is not authorized.");
            }
        }
        throw new Error("Login failed. Please try again.");
    }
};

export default api;
