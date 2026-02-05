import api from './api';

export default {
    /**
     * 取得打擊結果選項
     * 包含 locationOptions 和 ballTypeOptions 用於條件式過濾
     */
    getMatchupResults() {
        return api.get('/Z00/Z00_resultOptions/Z00_matchupResultList');
    },

    /**
     * 取得擊球落點選項
     */
    getLocations() {
        return api.get('/Z00/Z00_resultOptions/Z00_positionAndLocation/0');
    },

    /**
     * 取得擊球型態選項
     */
    getBallTypes() {
        return api.get('/Z00/Z00_resultOptions/Z00_ballInPlayType/0');
    }
};
