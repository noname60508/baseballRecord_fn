import api from './api';

export default {
    // 取得打擊紀錄列表
    getBattingRecords() {
        return api.get('/B00/B20/B21_battingStatistics');
    },

    // 建立打擊紀錄
    createBattingRecord(data) {
        return api.post('/B00/B20/B21_battingStatistics', data);
    },

    // 取得打擊統計數據
    getBattingStatistics() {
        return api.get('/B00/B20/B21_battingStatistics/dataStatistics');
    }
};
