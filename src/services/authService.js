import api from './api';

export default {
    // 登入
    login(credentials) {
        return api.get('/login', { params: credentials });
    },

    // 登出
    logout() {
        return api.get('/A00/A10/A11_authController/logout');
    },

    // 取得使用者資訊
    getUserInfo() {
        return api.get('/A00/A10/A11_authController/user');
    },

    // 發送驗證信
    sendVerificationEmail() {
        return api.post('/A00/A10/A11_authController/verification-notification');
    }
};
