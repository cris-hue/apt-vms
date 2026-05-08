import axios from 'axios';

const API = axios.create({
  // Use the Dev Tunnel URL for mobile testing
  // Ensure port 5000 in VS Code is set to "Public" visibility
  baseURL: 'https://ntdj1z16-5000.uks1.devtunnels.ms/api', 
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;