import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AIService } from '../services/aiService';
import { ExcelService } from '../services/excelService';
import { PDFService } from '../services/pdfService';
import { HistoryService } from '../services/historyService';
import { EmployeeService } from '../services/employeeService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

export class ReportController {
  private excelService = new ExcelService();
  private pdfService = new PDFService();
  private historyService = new HistoryService();
  private employeeService = new EmployeeService();

  generateReport = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    try {
      const { tasks, employee_name, position, report_date, provider, api_key, model_name, template } = req.body;

      const aiService = new AIService(provider, api_key, model_name);
      
      const reportData = await aiService.generateSchedule({
        tasks,
        employee_name,
        position,
        report_date,
        provider,
        api_key,
        model_name
      });

      // Generate Excel
      const templateBuffer = template ? Buffer.from(template, 'base64') : undefined;
      const excelBuffer = await this.excelService.generateExcel(reportData, templateBuffer);
      
      // Generate PDF
      const pdfBuffer = await this.pdfService.generatePDF(reportData);

      // Save to history
      const historyEntry = {
        ...reportData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      await this.historyService.saveHistoryEntry(historyEntry);

      // Save employee
      await this.employeeService.addEmployee(employee_name, position);

      const response: ApiResponse = {
        success: true,
        data: {
          report: reportData,
          excel: excelBuffer.toString('base64'),
          pdf: pdfBuffer.toString('base64')
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      logger.error('Report generation error:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  };

  getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const history = await this.historyService.getHistory();
      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch history'
      });
    }
  };

  getEmployeeHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employee } = req.params;
      const history = await this.historyService.getEmployeeHistory(employee);
      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch employee history'
      });
    }
  };

  getHistoryByDate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.params;
      const history = await this.historyService.getHistoryByDate(date);
      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch history by date'
      });
    }
  };

  deleteHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.historyService.deleteHistoryEntry(id);
      res.json({
        success: deleted,
        message: deleted ? 'History entry deleted' : 'History entry not found',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete history entry'
      });
    }
  };

  saveHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const entry = await this.historyService.saveHistoryEntry(req.body);
      res.json({
        success: true,
        data: entry,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to save history'
      });
    }
  };

  getEmployees = async (req: Request, res: Response): Promise<void> => {
    try {
      const employees = await this.employeeService.getEmployees();
      res.json({
        success: true,
        data: employees,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch employees'
      });
    }
  };

  addEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, position } = req.body;
      const employee = await this.employeeService.addEmployee(name, position);
      res.json({
        success: true,
        data: employee,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to add employee'
      });
    }
  };

  deleteEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name } = req.params;
      const deleted = await this.employeeService.deleteEmployee(name);
      res.json({
        success: deleted,
        message: deleted ? 'Employee deleted successfully' : 'Employee not found',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete employee'
      });
    }
  };

  updateEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name } = req.params;
      const { position } = req.body;
      const employee = await this.employeeService.updateEmployee(name, position);
      if (!employee) {
        res.status(404).json({
          success: false,
          error: 'Employee not found'
        });
        return;
      }
      res.json({
        success: true,
        data: employee,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update employee'
      });
    }
  };
}