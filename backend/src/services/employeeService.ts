import { Employee } from '../types';
import { FileUtils } from '../utils/fileUtils';
import { logger } from '../utils/logger';
import path from 'path';

const EMPLOYEE_FILE = path.join(__dirname, '../../data/employees.json');

export class EmployeeService {
  private employees: Employee[] = [];

  constructor() {
    this.loadEmployees();
  }

  private async loadEmployees(): Promise<void> {
    try {
      const data = await FileUtils.readJSON<Employee[]>(EMPLOYEE_FILE);
      this.employees = data || [];
    } catch (error) {
      logger.warn('Failed to load employees, starting with empty:', error);
      this.employees = [];
    }
  }

  private async saveEmployees(): Promise<void> {
    try {
      await FileUtils.writeJSON(EMPLOYEE_FILE, this.employees);
    } catch (error) {
      logger.error('Failed to save employees:', error);
      throw new Error('Failed to save employees');
    }
  }

  async getEmployees(): Promise<Employee[]> {
    return this.employees;
  }

  async addEmployee(name: string, position: string): Promise<Employee> {
    const existing = this.employees.find(e => e.name === name);
    if (existing) {
      existing.position = position;
      existing.updated_at = new Date().toISOString();
      await this.saveEmployees();
      return existing;
    }

    const newEmployee: Employee = {
      name,
      position,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.employees.push(newEmployee);
    await this.saveEmployees();
    return newEmployee;
  }

  async deleteEmployee(name: string): Promise<boolean> {
    const index = this.employees.findIndex(e => e.name === name);
    if (index === -1) return false;
    
    this.employees.splice(index, 1);
    await this.saveEmployees();
    return true;
  }

  async getEmployee(name: string): Promise<Employee | null> {
    return this.employees.find(e => e.name === name) || null;
  }

  async updateEmployee(name: string, position: string): Promise<Employee | null> {
    const employee = await this.getEmployee(name);
    if (!employee) return null;
    
    employee.position = position;
    employee.updated_at = new Date().toISOString();
    await this.saveEmployees();
    return employee;
  }

  async employeeExists(name: string): Promise<boolean> {
    return this.employees.some(e => e.name === name);
  }
}