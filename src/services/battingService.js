import api from './api';

export default {
    // 取得打擊紀錄列表
    getBattingRecords(params) {
        return api.get('/B00/B20/B21_battingStatistics', { params });
    },

    // 建立打擊紀錄
    createBattingRecord(data) {
        return api.post('/B00/B20/B21_battingStatistics', data);
    },

    // 更新打擊統計 (由比賽 ID)
    updateBattingRecord(id, data) {
        return api.put(`/B00/B20/B21_battingStatistics/${id}`, data);
    },

    // 取得打擊統計數據
    getBattingStatistics(params) {
        return api.get('/B00/B20/B21_battingStatistics/dataStatistics', { params });
    },

    // 建立打擊結果 (逐打席)
    createBattingResult(data) {
        return api.post('/B00/B20/B21_battingResult', data);
    }
};
