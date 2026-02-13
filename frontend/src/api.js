import axios from 'axios';
import { io } from 'socket.io-client';

// 1. Setup Axios for HTTP requests
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Match your backend port
});

// 2. Request Interceptor: Automatically attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // This adds 'Authorization: Bearer <your_token>' to the headers
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: Handle expired tokens globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If the backend says the token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      // Optional: window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

// 4. Setup Socket.io for Real-Time updates
// Note: We pass the token in 'auth' so the backend can verify the socket connection
const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token')
  }
});

export { api, socket };