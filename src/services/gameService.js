import api from './api';

export default {
    // 取得比賽列表
    getGames() {
        return api.get('/B00/B10/B11_gamesController');
    },

    // 建立比賽
    createGame(gameData) {
        return api.post('/B00/B10/B11_gamesController', gameData);
    },

    // 取得單一比賽
    getGame(id) {
        return api.get(`/B00/B10/B11_gamesController/${id}`);
    },

    // 更新比賽
    updateGame(id, gameData) {
        return api.put(`/B00/B10/B11_gamesController/${id}`, gameData);
    },

    // 刪除比賽
    deleteGame(id) {
        return api.delete(`/B00/B10/B11_gamesController/${id}`);
    }
};
