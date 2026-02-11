import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000'; // Your Ubuntu backend URL

export const api = axios.create({
  baseURL: `${API_URL}/api`,
});

export const socket = io(API_URL);