import api from './api';

export default {
    // 球隊 CRUD
    teams: {
        getAll(params) {
            return api.get('/Z00/Z00_teamsController', { params });
        },
        create(data) {
            return api.post('/Z00/Z00_teamsController', data);
        },
        update(id, data) {
            return api.put(`/Z00/Z00_teamsController/${id}`, data);
        },
        delete(id) {
            return api.delete(`/Z00/Z00_teamsController/${id}`);
        }
    },

    // 賽季 CRUD
    seasons: {
        getAll() {
            return api.get('/Z00/Z00_seasonsController');
        },
        create(data) {
            return api.post('/Z00/Z00_seasonsController', data);
        },
        update(id, data) {
            return api.put(`/Z00/Z00_seasonsController/${id}`, data);
        },
        delete(id) {
            return api.delete(`/Z00/Z00_seasonsController/${id}`);
        }
    },

    // 場地 CRUD
    fields: {
        getAll() {
            return api.get('/Z00/Z00_fieldsController');
        },
        create(data) {
            return api.post('/Z00/Z00_fieldsController', data);
        },
        update(id, data) {
            return api.put(`/Z00/Z00_fieldsController/${id}`, data);
        },
        delete(id) {
            return api.delete(`/Z00/Z00_fieldsController/${id}`);
        }
    }
};
