import ExcelJS from 'exceljs';
import { ReportData } from '../types';
import { TIME_SLOTS } from '../constants';
import { Buffer } from 'buffer';
import { logger } from '../utils/logger';

export class ExcelService {
  async generateExcel(data: ReportData, templateBuffer?: Buffer): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    let worksheet: ExcelJS.Worksheet;

    try {
      if (templateBuffer) {
        try {
          await workbook.xlsx.load(templateBuffer);
          worksheet = workbook.getWorksheet(1) || workbook.addWorksheet('EOD Report');
        } catch (error) {
          logger.warn('Failed to load template, using default layout');
          worksheet = workbook.addWorksheet('EOD Report');
          this.setupDefaultLayout(worksheet, data);
        }
      } else {
        worksheet = workbook.addWorksheet('EOD Report');
        this.setupDefaultLayout(worksheet, data);
      }

      this.fillReportData(worksheet, data);
      this.applyFormatting(worksheet);

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      logger.error('Excel generation error:', error);
      throw new Error('Failed to generate Excel file');
    }
  }

  private setupDefaultLayout(worksheet: ExcelJS.Worksheet, data: ReportData): void {
    // Title
    worksheet.mergeCells('B1:C1');
    const titleCell = worksheet.getCell('B1');
    titleCell.value = 'EOD REPORT';
    titleCell.font = { name: 'Calibri', size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'center' };

    // Employee details
    const details = [
      ['B3', 'Name Of Employee', 'C3'],
      ['B4', 'Position', 'C4'],
      ['B5', 'Date', 'C5']
    ];

    details.forEach(([labelCell, label, valueCell]) => {
      worksheet.getCell(labelCell).value = label;
      worksheet.getCell(labelCell).font = { bold: true };
    });

    // Headers
    const headers = ['B7', 'C7', 'D7'];
    const headerLabels = ['Time', 'Activity', 'Description'];
    headers.forEach((cell, index) => {
      worksheet.getCell(cell).value = headerLabels[index];
      worksheet.getCell(cell).font = { bold: true };
    });

    // Set column widths
    worksheet.getColumn('B').width = 18;
    worksheet.getColumn('C').width = 28;
    worksheet.getColumn('D').width = 35;

    // Page setup
    worksheet.pageSetup = {
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    };
  }

  private fillReportData(worksheet: ExcelJS.Worksheet, data: ReportData): void {
    worksheet.getCell('C3').value = data.employee_name;
    worksheet.getCell('C4').value = data.position;
    worksheet.getCell('C5').value = data.date;

    const startRow = 8;
    data.schedule.forEach((entry, index) => {
      const row = startRow + index;
      worksheet.getCell(`B${row}`).value = entry.slot;
      worksheet.getCell(`C${row}`).value = entry.activity;
      worksheet.getCell(`D${row}`).value = entry.description;
    });
  }

  private applyFormatting(worksheet: ExcelJS.Worksheet): void {
    const thinBorder = {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const }
    };

    // Apply borders to schedule
    const startRow = 7;
    const endRow = 15;
    for (let row = startRow; row <= endRow; row++) {
      for (let col = 2; col <= 4; col++) {
        const cell = worksheet.getCell(row, col);
        cell.border = thinBorder;
        cell.alignment = { 
          vertical: 'middle',
          wrapText: true
        };
      }
    }

    // Center headers
    const headerRow = worksheet.getRow(7);
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add some styling to employee info
    ['C3', 'C4', 'C5'].forEach(cell => {
      const cellObj = worksheet.getCell(cell);
      cellObj.border = thinBorder;
      cellObj.alignment = { vertical: 'middle' };
    });
  }
}