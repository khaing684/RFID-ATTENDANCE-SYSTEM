import axios from 'axios';
 const api = axios.create({
    baseURL: '/api',
 });


 // Request interceptor - token auto attach
 api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
 });

 // Response interceptor - 401 ဆိုရင် login ပြန်ပို့
 api.interceptors.response.use(
    (res) => res,
    (err) =>{
        if (err.response?.status === 401 ){
            localStorage.removeItem('token');
            window.location.href = '/login';

        }
        return Promise.reject(err);
    }
 )

 export default api;