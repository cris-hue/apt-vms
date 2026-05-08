import axios from 'axios';

const API = axios.create({
  // This bypasses the network entirely. Use this to log in on your laptop.
  baseURL: 'http://localhost:5000/api', 
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;