import { HistoryEntry } from '../types';
import { FileUtils } from '../utils/fileUtils';
import { logger } from '../utils/logger';
import path from 'path';

const HISTORY_FILE = path.join(__dirname, '../../data/history.json');

export class HistoryService {
  private history: HistoryEntry[] = [];

  constructor() {
    this.loadHistory();
  }

  private async loadHistory(): Promise<void> {
    try {
      const data = await FileUtils.readJSON<HistoryEntry[]>(HISTORY_FILE);
      this.history = data || [];
    } catch (error) {
      logger.warn('Failed to load history, starting with empty:', error);
      this.history = [];
    }
  }

  private async saveHistory(): Promise<void> {
    try {
      await FileUtils.writeJSON(HISTORY_FILE, this.history);
    } catch (error) {
      logger.error('Failed to save history:', error);
      throw new Error('Failed to save history');
    }
  }

  async getHistory(): Promise<HistoryEntry[]> {
    return this.history;
  }

  async getEmployeeHistory(employeeName: string): Promise<HistoryEntry[]> {
    return this.history.filter(h => h.employee_name === employeeName);
  }

  async getHistoryByDate(date: string): Promise<HistoryEntry[]> {
    return this.history.filter(h => h.date === date);
  }

  async saveHistoryEntry(entry: HistoryEntry): Promise<HistoryEntry> {
    if (!entry.id) {
      entry.id = Date.now().toString();
    }
    if (!entry.timestamp) {
      entry.timestamp = new Date().toISOString();
    }
    
    this.history.unshift(entry);
    await this.saveHistory();
    return entry;
  }

  async deleteHistoryEntry(id: string): Promise<boolean> {
    const index = this.history.findIndex(h => h.id === id);
    if (index === -1) return false;
    
    this.history.splice(index, 1);
    await this.saveHistory();
    return true;
  }

  async clearHistory(): Promise<void> {
    this.history = [];
    await this.saveHistory();
  }

  async getHistoryCount(): Promise<number> {
    return this.history.length;
  }

  async getUniqueEmployees(): Promise<string[]> {
    const employees = new Set(this.history.map(h => h.employee_name));
    return Array.from(employees);
  }
}