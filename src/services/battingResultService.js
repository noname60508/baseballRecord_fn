import api from './api';

export default {
    /**
     * 新增或更新逐打席記錄
     * @param {Object} data - { game_id, result: [{ id?, orderNo, pitcher, Z00_matchupResultList_id, Z00_location_id, Z00_BallInPlayType_id, RBI, RISP }] }
     */
    updateOrCreate(data) {
        return api.post('/B00/B20/B21_battingResult/updateOrCreate', data);
    },

    /**
     * 刪除逐打席記錄（支援複數刪除）
     * @param {Array<number>} resultIds - 要刪除的逐打席 ID 陣列
     */
    destroy(resultIds) {
        const params = new URLSearchParams();
        resultIds.forEach(id => params.append('resultId[]', id));
        return api.delete(`/B00/B20/B21_battingResult/destroy?${params.toString()}`);
    }
};
