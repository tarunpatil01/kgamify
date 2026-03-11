// Professional invoice generator with itemized breakdown and GST
const PDFDocument = require('pdfkit');

function formatAmount(amount, currency = 'INR') {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}

function generateInvoicePdfBuffer({
  invoiceId,
  companyName,
  companyEmail,
  companyAddress = '',
  companyGSTIN = '',
  billingItems = [],
  subtotal = 0,
  gstRate = 18,
  gstAmount = 0,
  total = 0,
  currency = 'INR',
  billingStartDate,
  billingEndDate,
  nextBillingDate,
  issuedAt = new Date()
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (d) => chunks.push(d));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const pageWidth = doc.page.width;
      const leftMargin = 50;
      const rightMargin = pageWidth - 50;

      // Top orange border
      doc.rect(0, 0, pageWidth, 6).fill('#ff8200');

      // kGamify Logo (text-based)
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#ff8200').text('kGamify', leftMargin, 25);
      doc.fontSize(9).font('Helvetica').fillColor('#666').text('Job Portal Platform', leftMargin, 55);

      // INVOICE title on right
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#333').text('INVOICE', rightMargin - 120, 25, { width: 120, align: 'right' });
      
      // Invoice details below title
      doc.fontSize(10).font('Helvetica').fillColor('#666');
      doc.text(`Invoice #: ${invoiceId}`, rightMargin - 200, 60, { width: 200, align: 'right' });
      doc.text(`Date: ${new Date(issuedAt).toLocaleDateString('en-GB')}`, rightMargin - 200, 75, { width: 200, align: 'right' });
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#ff8200');
      doc.text(`Amount: ${formatAmount(total, currency)}`, rightMargin - 200, 92, { width: 200, align: 'right' });

      // Orange divider line
      doc.moveTo(leftMargin, 115).lineTo(rightMargin, 115).strokeColor('#ff8200').lineWidth(2).stroke();

      // FROM Section (left side)
      let yPos = 135;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#ff8200').text('FROM', leftMargin, yPos);
      yPos += 18;
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#333').text('YANTRIKISOFT PRIVATE LIMITED', leftMargin, yPos);
      yPos += 16;
      doc.fontSize(9).font('Helvetica').fillColor('#555');
      doc.text('273, SATRA PLAZA, PLOT 19, SECTOR 19D,', leftMargin, yPos);
      yPos += 12;
      doc.text('VASHI, Thane, MAHARASHTRA 400703', leftMargin, yPos);
      yPos += 12;
      doc.text('Phone: 8879688067', leftMargin, yPos);
      yPos += 12;
      doc.text('Email: support@kgamify.in', leftMargin, yPos);

      // BILLED TO Section (right side)
      yPos = 135;
      const rightColX = 320;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#ff8200').text('BILLED TO', rightColX, yPos);
      yPos += 18;
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#333').text(companyName || 'Company', rightColX, yPos, { width: 200 });
      yPos += 16;
      doc.fontSize(9).font('Helvetica').fillColor('#555');
      if (companyAddress) {
        doc.text(companyAddress, rightColX, yPos, { width: 200 });
        yPos += 24;
      }
      if (companyEmail) {
        doc.text(`Email: ${companyEmail}`, rightColX, yPos, { width: 200 });
        yPos += 12;
      }
      if (companyGSTIN) {
        doc.text(`GSTIN: ${companyGSTIN}`, rightColX, yPos, { width: 200 });
      }

      // Billing Period Section
      yPos = 235;
      const billStart = billingStartDate ? new Date(billingStartDate).toLocaleDateString('en-GB') : 'N/A';
      const billEnd = billingEndDate ? new Date(billingEndDate).toLocaleDateString('en-GB') : 'N/A';
      const nextBill = nextBillingDate ? new Date(nextBillingDate).toLocaleDateString('en-GB') : 'N/A';

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#ff8200').text('BILLING PERIOD', leftMargin, yPos);
      yPos += 16;
      doc.fontSize(9).font('Helvetica').fillColor('#555');
      doc.text(`${billStart}  to  ${billEnd}`, leftMargin, yPos);
      yPos += 12;
      doc.fillColor('#888').text(`Next Billing: ${nextBill}`, leftMargin, yPos);

      // Items Table
      const tableTop = 290;
      const colDesc = leftMargin;
      const colUnits = 320;
      const colPrice = 400;
      const colAmount = 480;

      // Table Header with background
      doc.rect(leftMargin, tableTop, rightMargin - leftMargin, 24).fill('#f5f5f5');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#333');
      doc.text('DESCRIPTION', colDesc + 8, tableTop + 7);
      doc.text('QTY', colUnits, tableTop + 7, { width: 60, align: 'center' });
      doc.text('UNIT PRICE', colPrice, tableTop + 7, { width: 70, align: 'right' });
      doc.text('AMOUNT', colAmount, tableTop + 7, { width: 60, align: 'right' });

      // Table Rows
      yPos = tableTop + 30;
      doc.font('Helvetica').fillColor('#333');
      
      if (Array.isArray(billingItems) && billingItems.length > 0) {
        billingItems.forEach((item) => {
          doc.fontSize(10).text(item.description || 'Subscription', colDesc + 8, yPos, { width: 250 });
          doc.text((item.units || 1).toString(), colUnits, yPos, { width: 60, align: 'center' });
          doc.text(formatAmount(item.unitPrice || 0, currency), colPrice, yPos, { width: 70, align: 'right' });
          const rowTotal = (item.units || 1) * (item.unitPrice || 0);
          doc.text(formatAmount(rowTotal, currency), colAmount, yPos, { width: 60, align: 'right' });
          yPos += 22;
        });
      } else {
        doc.fontSize(10).text('Subscription Plan', colDesc + 8, yPos, { width: 250 });
        doc.text('1', colUnits, yPos, { width: 60, align: 'center' });
        doc.text(formatAmount(subtotal || total, currency), colPrice, yPos, { width: 70, align: 'right' });
        doc.text(formatAmount(subtotal || total, currency), colAmount, yPos, { width: 60, align: 'right' });
        yPos += 22;
      }

      // Line under table
      doc.moveTo(leftMargin, yPos).lineTo(rightMargin, yPos).strokeColor('#ddd').lineWidth(1).stroke();
      yPos += 15;

      // Totals Section (right aligned)
      const totalsLabelX = 380;
      const totalsValueX = 480;

      doc.fontSize(10).font('Helvetica').fillColor('#555');
      doc.text('Sub Total:', totalsLabelX, yPos, { width: 90, align: 'right' });
      doc.text(formatAmount(subtotal || total, currency), totalsValueX, yPos, { width: 60, align: 'right' });
      yPos += 18;

      doc.text(`IGST @ ${gstRate}%:`, totalsLabelX, yPos, { width: 90, align: 'right' });
      doc.text(formatAmount(gstAmount, currency), totalsValueX, yPos, { width: 60, align: 'right' });
      yPos += 18;

      // Total line
      doc.moveTo(totalsLabelX, yPos).lineTo(rightMargin, yPos).strokeColor('#ff8200').lineWidth(1.5).stroke();
      yPos += 8;

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#ff8200');
      doc.text('TOTAL:', totalsLabelX, yPos, { width: 90, align: 'right' });
      doc.text(formatAmount(total, currency), totalsValueX, yPos, { width: 60, align: 'right' });
      yPos += 30;

      // Amount Due Box
      const boxWidth = 220;
      const boxX = (pageWidth - boxWidth) / 2;
      doc.roundedRect(boxX, yPos, boxWidth, 55, 5).fillAndStroke('#fff8f0', '#ff8200');
      doc.fontSize(10).font('Helvetica').fillColor('#666').text('Amount Due (INR)', boxX, yPos + 10, { width: boxWidth, align: 'center' });
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#ff8200').text(formatAmount(total, currency), boxX, yPos + 28, { width: boxWidth, align: 'center' });

      // Terms & Conditions at bottom
      const footerY = doc.page.height - 90;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#333').text('Terms & Conditions:', leftMargin, footerY);
      doc.fontSize(8).font('Helvetica').fillColor('#666');
      doc.text('1) This subscription is non-refundable once activated.', leftMargin, footerY + 12);
      doc.text('2) Money refund is generally not possible; exceptions may apply only if required by law.', leftMargin, footerY + 23);
      doc.text('3) Subscriptions are non-transferable between companies.', leftMargin, footerY + 34);

      // Footer contact
      doc.fontSize(8).fillColor('#888').text('For support: support@kgamify.in | www.kgamify.in', leftMargin, footerY + 52);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateInvoicePdfBuffer };
