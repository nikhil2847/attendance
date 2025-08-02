// const express = require('express');
// import express from 'express';
// import db from '../config/database.js';
// import PDFDocument from 'pdfkit';
// import { requireManager } from '../middleware/auth.js';
// import moment from 'moment-timezone';
const express = require('express');
const db = require('../config/database.js');
const PDFDocument = require('pdfkit');
const { requireManager } = require('../middleware/auth.js');
const moment = require('moment-timezone');
const router = express.Router();

// Generate invoice number
const generateInvoiceNumber = async (organizationId) => {
  // Get the highest invoice number for this organization to avoid duplicates
  const [result] = await db.execute(
    `SELECT invoice_number FROM invoices 
     WHERE organization_id = ? 
     ORDER BY id DESC 
     LIMIT 1`,
    [organizationId]
  );
  
  let nextNumber = 1;
  if (result.length > 0) {
    // Extract the number from the last invoice (e.g., "INV-007-0003" -> 3)
    const lastInvoiceNumber = result[0].invoice_number;
    const lastNumber = parseInt(lastInvoiceNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  
  return `INV-${organizationId.toString().padStart(3, '0')}-${nextNumber.toString().padStart(4, '0')}`;
};

// Create invoice
router.post('/', requireManager, async (req, res) => {
  try {
    const {
      userId,
      startDate,
      endDate,
      hourlyRate,
      billedTo,
      billedToAddress
    } = req.body;

    const organizationId = req.user.organization_id;

    // Get attendance records for the period
    let attendanceQuery = `
      SELECT SUM(total_hours) as total_hours
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE u.organization_id = ? 
      AND a.check_out IS NOT NULL
      AND DATE(a.check_in) >= ? 
      AND DATE(a.check_in) <= ?
    `;
    let params = [organizationId, startDate, endDate];

    if (userId) {
      attendanceQuery += ' AND a.user_id = ?';
      params.push(userId);
    }

    const [attendanceResult] = await db.execute(attendanceQuery, params);
    const totalHours = attendanceResult[0].total_hours || 0;
    const totalAmount = totalHours * hourlyRate;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(organizationId);

    // Create invoice
    const [result] = await db.execute(
      `INSERT INTO invoices (
        invoice_number, organization_id, user_id, start_date, end_date,
        hourly_rate, total_hours, total_amount, billed_to, billed_to_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber, organizationId, userId || null, startDate, endDate,
        hourlyRate, totalHours, totalAmount, billedTo, billedToAddress
      ]
    );

    res.json({
      message: 'Invoice created successfully',
      invoiceId: result.insertId,
      invoiceNumber,
      totalHours,
      totalAmount
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invoices
router.get('/', requireManager, async (req, res) => {
  try {
    const [invoices] = await db.execute(
      `SELECT i.*, u.first_name, u.last_name, o.name as organization_name
       FROM invoices i
       LEFT JOIN users u ON i.user_id = u.id
       JOIN organizations o ON i.organization_id = o.id
       WHERE i.organization_id = ?
       ORDER BY i.created_at DESC`,
      [req.user.organization_id]
    );

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this import at the top
router.get('/:invoiceId/download', requireManager, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const [invoices] = await db.execute(
      `SELECT i.*, u.first_name, u.last_name, o.name as organization_name
       FROM invoices i
       LEFT JOIN users u ON i.user_id = u.id
       JOIN organizations o ON i.organization_id = o.id
       WHERE i.id = ? AND i.organization_id = ?`,
      [invoiceId, req.user.organization_id]
    );
    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const invoice = invoices[0];

    // Convert UTC dates to EST and format MM/DD/YYYY
    const formatDateEST = (dateStr) => {
      if (!dateStr) return '';
      return moment.utc(dateStr).tz('America/New_York').format('MM/DD/YYYY');
    };

    const createdAtEST = formatDateEST(invoice.created_at);
    const startDateEST = formatDateEST(invoice.start_date);
    const endDateEST = formatDateEST(invoice.end_date);

    // Format currency and numbers with 2 decimals
    const formatCurrency = (num) => `$${Number(num).toFixed(2)}`;
    const formatNumber = (num) => Number(num).toFixed(2);

    // PDF A4 page size in points: 595.28 x 841.89
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);
    doc.pipe(res);

    // Helpers for modular sections
    const drawHeader = () => {
      doc
        .rect(0, 0, doc.page.width, 90)
        .fill('#3B82F6');

      doc
        .fillColor('white')
        .fontSize(26)
        .font('Helvetica-Bold')
        .text(invoice.organization_name, 60, 30);

      doc
        .fontSize(16)
        .font('Helvetica')
        .text(`Invoice #${invoice.invoice_number}`, doc.page.width - 200, 40, {
          width: 140,
          align: 'right'
        });
    };

    const drawInvoiceDetailsBox = () => {
      const x = 50;
      const y = 110;
      const boxWidth = doc.page.width - 100;
      const boxHeight = 90;

      doc
        .fillColor('black')
        .fontSize(12)
        .font('Helvetica-Bold')
        .rect(x, y, boxWidth, boxHeight)
        .stroke('#E5E7EB')
        .text('Invoice Details', x + 10, y + 10);

      doc
        .font('Helvetica')
        .fontSize(11)
        .text(`Status: ${invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'N/A'}`, x + 10, y + 35)
        .text(`Created At: ${createdAtEST}`, x + 10, y + 55)
        .text(`Billing Period: ${startDateEST} - ${endDateEST}`, x + 250, y + 35);
    };

    const drawBilledToBox = () => {
      const x = 50;
      const y = 210;
      const boxWidth = doc.page.width - 100;
      const boxHeight = 70;

      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .rect(x, y, boxWidth, boxHeight)
        .stroke('#E5E7EB')
        .text('Billed To', x + 10, y + 10);

      doc
        .font('Helvetica')
        .fontSize(11)
        .text(invoice.billed_to || 'N/A', x + 10, y + 35)
        .text(invoice.billed_to_address || '', x + 150, y + 35, {
          width: boxWidth - 160,
          align: 'left'
        });
    };

    const drawEmployeeBox = () => {
      const x = 50;
      const y = 290;
      const boxWidth = doc.page.width - 100;
      const boxHeight = 50;

      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .rect(x, y, boxWidth, boxHeight)
        .stroke('#E5E7EB')
        .text('Employee', x + 10, y + 15);

      const employeeName = `${invoice.first_name || ''} ${invoice.last_name || ''}`.trim() || 'N/A';
      doc
        .font('Helvetica')
        .fontSize(11)
        .text(employeeName, x + 100, y + 15);
    };

    const drawTableHeader = () => {
      const y = 360;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('black')
        .text('Description', 50, y)
        .text('Hours', 280, y, { width: 60, align: 'right' })
        .text('Rate', 360, y, { width: 80, align: 'right' })
        .text('Amount', 460, y, { width: 80, align: 'right' });

      // Draw a line below header
      doc.moveTo(50, y + 18).lineTo(doc.page.width - 50, y + 18).stroke();
    };

    const drawTableRow = () => {
      const y = 385;
      doc
        .font('Helvetica')
        .fontSize(11)
        .text(`Work from ${startDateEST} to ${endDateEST}`, 50, y)
        .text(formatNumber(invoice.total_hours || 0), 280, y, { width: 60, align: 'right' })
        .text(formatCurrency(invoice.hourly_rate || 0), 360, y, { width: 80, align: 'right' })
        .text(formatCurrency(invoice.total_amount || 0), 460, y, { width: 80, align: 'right' });
    };

    const drawTotals = () => {
      const labelX = 360;
      const valueX = 500; // Leave enough space between label and value
      const y = 430;
      const lineHeight = 20;

      doc
        .font('Helvetica-Bold')
        .fontSize(12)

        // Total Hours
        .text('Total Hours:', labelX, y, { align: 'left' })
        .text(formatNumber(invoice.total_hours || 0), valueX, y, { align: 'right' })

        // Total Amount
        .text('Total Amount:', labelX, y + lineHeight, { align: 'left' })
        .text(formatCurrency(invoice.total_amount || 0), valueX, y + lineHeight, { align: 'right' });
    };

    const drawFooter = () => {
      const y = doc.page.height - 100;
      doc
        .fontSize(10)
        .fillColor('#6B7280')
        .text('Thank you for your business!', 0, y, { align: 'center' });
    };

    // Draw all sections
    drawHeader();
    drawInvoiceDetailsBox();
    drawBilledToBox();
    drawEmployeeBox();
    drawTableHeader();
    drawTableRow();
    drawTotals();
    drawFooter();

    doc.end();

  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ error: 'Failed to generate invoice PDF' });
  }
});

// Get invoice by ID
router.get('/:invoiceId', requireManager, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const [invoices] = await db.execute(
      `SELECT i.*, u.first_name, u.last_name, o.name as organization_name
       FROM invoices i
       LEFT JOIN users u ON i.user_id = u.id
       JOIN organizations o ON i.organization_id = o.id
       WHERE i.id = ? AND i.organization_id = ?`,
      [invoiceId, req.user.organization_id]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoices[0]);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete invoice
router.delete('/:invoiceId', requireManager, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Check if invoice exists and belongs to the organization
    const [invoices] = await db.execute(
      'SELECT id FROM invoices WHERE id = ? AND organization_id = ?',
      [invoiceId, req.user.organization_id]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Delete the invoice
    await db.execute(
      'DELETE FROM invoices WHERE id = ? AND organization_id = ?',
      [invoiceId, req.user.organization_id]
    );

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// export default router;
module.exports = router;