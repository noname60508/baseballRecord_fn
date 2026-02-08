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

    // 發送驗證信
    sendVerificationEmail() {
        return api.post('/A00/A10/A11_authController/verification-notification');
    },

    // 註冊
    register(userData) {
        return api.post('/register', userData);
    },

    // 忘記密碼
    forgotPassword(data) {
        return api.post('/forgotPassword', data);
    },

    // 重設密碼
    resetForgotPassword(data) {
        return api.post('/resetForgotPassword', data);
    }
};
