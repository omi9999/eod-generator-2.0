import * as PDFDocument from 'pdfkit';
import { ReportData } from '../types';
import { Buffer } from 'buffer';
import { logger } from '../utils/logger';

export class PDFService {
  generatePDF(data: ReportData): Buffer {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        info: {
          Title: 'EOD Report',
          Author: data.employee_name,
          Subject: 'End of Day Report',
        }
      });
      
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {});

      // Title
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('EOD REPORT', { align: 'center' });
      doc.moveDown();

      // Header line
      doc.strokeColor('#6366f1')
         .lineWidth(2)
         .moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .stroke();
      doc.moveDown();

      // Employee details
      doc.fontSize(12);
      
      const details = [
        ['Name Of Employee', data.employee_name],
        ['Position', data.position],
        ['Date', data.date]
      ];

      details.forEach(([label, value]) => {
        doc.font('Helvetica-Bold')
           .text(`${label}: `, { continued: true })
           .font('Helvetica')
           .text(value);
        doc.moveDown(0.5);
      });

      doc.moveDown();

      // Schedule table
      const tableTop = doc.y;
      const colWidths = [80, 120, 180];
      const rowHeight = 25;
      const tableWidth = colWidths.reduce((a, b) => a + b, 0);
      const startX = 50;

      // Draw table header
      const headers = ['Time', 'Activity', 'Description'];
      let currentX = startX;
      
      // Draw header background
      doc.rect(startX, tableTop, tableWidth, rowHeight)
         .fillAndStroke('#6366f1', '#6366f1');
      
      // Draw header text
      headers.forEach((header, index) => {
        doc.fillColor('white')
           .font('Helvetica-Bold')
           .fontSize(11)
           .text(header, currentX + 5, tableTop + 7, {
             width: colWidths[index] - 10,
             height: rowHeight - 10,
             align: 'left'
           });
        currentX += colWidths[index];
      });

      // Draw rows
      let currentY = tableTop + rowHeight;
      data.schedule.forEach((entry, rowIndex) => {
        const isLunch = entry.slot.includes('Lunch');
        const rowData = [entry.slot, entry.activity, entry.description];
        currentX = startX;

        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.rect(startX, currentY, tableWidth, rowHeight)
             .fillAndStroke('#f8fafc', '#e2e8f0');
        }

        if (isLunch) {
          doc.rect(startX, currentY, tableWidth, rowHeight)
             .fillAndStroke('#fef3c7', '#fcd34d');
        }

        rowData.forEach((cell, colIndex) => {
          const x = currentX + 5;
          const y = currentY + 5;
          
          doc.fillColor(isLunch ? '#92400e' : '#1e293b')
             .font(isLunch ? 'Helvetica-Bold' : 'Helvetica')
             .fontSize(9)
             .text(cell, x, y, {
               width: colWidths[colIndex] - 10,
               height: rowHeight - 10,
               align: 'left',
               ellipsis: true
             });
          
          currentX += colWidths[colIndex];
        });

        currentY += rowHeight;
      });

      // Footer
      doc.moveDown(2);
      doc.fontSize(10)
         .fillColor('#64748b')
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();

      return Buffer.concat(chunks);
    } catch (error) {
      logger.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF file');
    }
  }
}