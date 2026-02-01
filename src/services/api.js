import axios from 'axios';

// 建立 Axios 實例
const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// 請求攔截器 - 注入 token
api.interceptors.request.use(
    (config) => {
        // 從 localStorage 讀取 token
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // 如果是 FormData，讓瀏覽器自動設定 Content-Type (含 boundary)
        if (!(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        } else {
            // 移除預設的 Content-Type，讓瀏覽器自動處理
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 回應攔截器 - 更新 token
api.interceptors.response.use(
    (response) => {
        // 檢查回應標頭中是否有新的 token
        const newToken = response.headers['authorization'] || response.headers['Authorization'];
        if (newToken) {
            // 移除 "Bearer " 前綴（如果有）
            const token = newToken.replace('Bearer ', '');
            localStorage.setItem('auth_token', token);
        }
        return response;
    },
    (error) => {
        // 處理 401 未授權錯誤
        if (error.response && error.response.status === 401) {
            // 可以在此處理自動登出邏輯
            // localStorage.removeItem('auth_token');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
