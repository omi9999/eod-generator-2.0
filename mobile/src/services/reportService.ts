import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

export const reportService = {
  async generateReport(data: any) {
    const response = await api.post('/reports/generate', data);
    return response.data.data;
  },

  async getHistory() {
    const response = await api.get('/reports/history');
    return response.data.data;
  },

  async getEmployees() {
    const response = await api.get('/reports/employees');
    return response.data.data;
  },

  async addEmployee(name: string, position: string) {
    const response = await api.post('/reports/employees', { name, position });
    return response.data.data;
  },

  async deleteEmployee(name: string) {
    await api.delete(`/reports/employees/${encodeURIComponent(name)}`);
  },
};