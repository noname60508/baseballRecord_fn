import api from './api';

export default {
    // 取得指定使用者資訊
    getUser(id) {
        return api.get(`/A00/A10/A11_authController/${id}`);
    },

    // 更新使用者資訊
    updateUser(id, data) {
        return api.put(`/A00/A10/A11_authController/${id}`, data);
    },

    // 更新使用者頭像
    updateIcon(data) {
        // data 必須是 FormData
        if (data instanceof FormData) {
            // 這裡不需加 _method: PUT，因為是 POST 路由
            return api.post('/A00/A10/A11_authController/iconUpdate', data);
        }
        return Promise.reject(new Error('Data must be FormData'));
    },

    // 更新使用者密碼
    updatePassword(data) {
        return api.post(`/A00/A10/A11_authController/changePassword`, data);
    }
};
