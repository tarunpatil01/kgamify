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
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
      const chunks = [];
      doc.on('data', (d) => chunks.push(d));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const pageWidth = doc.page.width;
      const leftMargin = 40;
      const rightMargin = pageWidth - 40;

      // Top orange border
      doc.rect(0, 0, pageWidth, 5).fill('#ff8200');

      // kGamify Logo (text-based)
      doc.fontSize(26).font('Helvetica-Bold').fillColor('#ff8200').text('kGamify', leftMargin, 18);
      doc.fontSize(9).font('Helvetica').fillColor('#666').text('Job Portal Platform', leftMargin, 46);

      // INVOICE title on right
      doc.fontSize(26).font('Helvetica-Bold').fillColor('#333').text('INVOICE', rightMargin - 110, 18, { width: 110, align: 'right' });
      
      // Invoice details below title
      doc.fontSize(9).font('Helvetica').fillColor('#666');
      doc.text(`Invoice #: ${invoiceId}`, rightMargin - 180, 48, { width: 180, align: 'right' });
      doc.text(`Date: ${new Date(issuedAt).toLocaleDateString('en-GB')}`, rightMargin - 180, 62, { width: 180, align: 'right' });

      // Orange divider line
      doc.moveTo(leftMargin, 82).lineTo(rightMargin, 82).strokeColor('#ff8200').lineWidth(1.5).stroke();

      // FROM Section (left side)
      let yPos = 95;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ff8200').text('FROM', leftMargin, yPos);
      yPos += 14;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text('YANTRIKISOFT PRIVATE LIMITED', leftMargin, yPos);
      yPos += 14;
      doc.fontSize(9).font('Helvetica').fillColor('#555');
      doc.text('273, SATRA PLAZA, PLOT 19, SECTOR 19D,', leftMargin, yPos);
      yPos += 12;
      doc.text('VASHI, Thane, MAHARASHTRA 400703', leftMargin, yPos);
      yPos += 12;
      doc.text('Phone: 8879688067', leftMargin, yPos);
      yPos += 12;
      doc.text('Email: support@kgamify.in', leftMargin, yPos);

      // BILLED TO Section (right side)
      yPos = 95;
      const rightColX = 310;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ff8200').text('BILLED TO', rightColX, yPos);
      yPos += 14;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text(companyName || 'Company', rightColX, yPos, { width: 220 });
      yPos += 14;
      doc.fontSize(9).font('Helvetica').fillColor('#555');
      if (companyAddress) {
        doc.text(companyAddress, rightColX, yPos, { width: 220 });
        yPos += 24;
      }
      if (companyEmail) {
        doc.text(`Email: ${companyEmail}`, rightColX, yPos, { width: 220 });
      }

      // Billing Period Section
      yPos = 175;
      const billStart = billingStartDate ? new Date(billingStartDate).toLocaleDateString('en-GB') : 'N/A';
      const billEnd = billingEndDate ? new Date(billingEndDate).toLocaleDateString('en-GB') : 'N/A';
      const nextBill = nextBillingDate ? new Date(nextBillingDate).toLocaleDateString('en-GB') : 'N/A';

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ff8200').text('BILLING PERIOD', leftMargin, yPos);
      yPos += 14;
      doc.fontSize(9).font('Helvetica').fillColor('#555');
      doc.text(`${billStart}  to  ${billEnd}`, leftMargin, yPos);
      doc.fillColor('#888').text(`Next Billing: ${nextBill}`, leftMargin + 180, yPos);

      // Items Table
      const tableTop = 210;
      const colDesc = leftMargin;
      const colUnits = 310;
      const colPrice = 390;
      const colAmount = 480;

      // Table Header with background
      doc.rect(leftMargin, tableTop, rightMargin - leftMargin, 22).fill('#f5f5f5');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#333');
      doc.text('DESCRIPTION', colDesc + 8, tableTop + 6);
      doc.text('QTY', colUnits, tableTop + 6, { width: 50, align: 'center' });
      doc.text('UNIT PRICE', colPrice, tableTop + 6, { width: 70, align: 'right' });
      doc.text('AMOUNT', colAmount, tableTop + 6, { width: 55, align: 'right' });

      // Table Rows
      yPos = tableTop + 30;
      doc.font('Helvetica').fillColor('#333');
      
      if (Array.isArray(billingItems) && billingItems.length > 0) {
        billingItems.forEach((item) => {
          doc.fontSize(10).text(item.description || 'Subscription', colDesc + 8, yPos, { width: 250 });
          doc.text((item.units || 1).toString(), colUnits, yPos, { width: 50, align: 'center' });
          doc.text(formatAmount(item.unitPrice || 0, currency), colPrice, yPos, { width: 70, align: 'right' });
          const rowTotal = (item.units || 1) * (item.unitPrice || 0);
          doc.text(formatAmount(rowTotal, currency), colAmount, yPos, { width: 55, align: 'right' });
          yPos += 20;
        });
      } else {
        doc.fontSize(10).text('Subscription Plan', colDesc + 8, yPos, { width: 250 });
        doc.text('1', colUnits, yPos, { width: 50, align: 'center' });
        doc.text(formatAmount(subtotal || total, currency), colPrice, yPos, { width: 70, align: 'right' });
        doc.text(formatAmount(subtotal || total, currency), colAmount, yPos, { width: 55, align: 'right' });
        yPos += 20;
      }

      // Line under table
      doc.moveTo(leftMargin, yPos + 5).lineTo(rightMargin, yPos + 5).strokeColor('#ff8200').lineWidth(1).stroke();
      yPos += 18;

      // Totals Section (right aligned)
      const totalsLabelX = 380;
      const totalsValueX = 480;
      
      // Totals background box
      const totalsBoxY = yPos - 5;
      const totalsBoxHeight = 80;
      doc.rect(totalsLabelX - 5, totalsBoxY, rightMargin - totalsLabelX + 5, totalsBoxHeight).fill('#f9f5f0');

      doc.fontSize(10).font('Helvetica').fillColor('#555');
      doc.text('Sub Total:', totalsLabelX, yPos, { width: 90, align: 'right' });
      doc.text(formatAmount(subtotal || total, currency), totalsValueX, yPos, { width: 55, align: 'right' });
      yPos += 16;

      doc.text(`IGST @ ${gstRate}%:`, totalsLabelX, yPos, { width: 90, align: 'right' });
      doc.text(formatAmount(gstAmount, currency), totalsValueX, yPos, { width: 55, align: 'right' });
      yPos += 16;

      // Total line
      doc.moveTo(totalsLabelX, yPos).lineTo(rightMargin, yPos).strokeColor('#ff8200').lineWidth(1).stroke();
      yPos += 8;

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#ff8200');
      doc.text('TOTAL:', totalsLabelX, yPos, { width: 90, align: 'right' });
      doc.text(formatAmount(total, currency), totalsValueX, yPos, { width: 55, align: 'right' });
      yPos += 35;

      // Amount Paid Box (centered) - with green checkmark styling
      const boxWidth = 200;
      const boxX = (pageWidth - boxWidth) / 2;
      doc.roundedRect(boxX, yPos, boxWidth, 50, 5).fillAndStroke('#f0fff4', '#28a745');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#28a745').text('PAID', boxX, yPos + 8, { width: boxWidth, align: 'center' });
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#28a745').text(formatAmount(total, currency), boxX, yPos + 24, { width: boxWidth, align: 'center' });
      yPos += 70;

      // Thank you section with border
      yPos += 25;
      doc.rect(leftMargin, yPos, rightMargin - leftMargin, 40).stroke('#ff8200');
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#ff8200').text('Thank You for Your Business!', leftMargin + 10, yPos + 6, { width: rightMargin - leftMargin - 20 });
      doc.fontSize(9).font('Helvetica').fillColor('#333').text('We appreciate your continued partnership.', leftMargin + 10, yPos + 20, { width: rightMargin - leftMargin - 20 });
      yPos += 50;
      
      // Orange divider line
      doc.moveTo(leftMargin, yPos).lineTo(rightMargin, yPos).strokeColor('#ff8200').lineWidth(1.5).stroke();
      yPos += 15;
      
      // Terms & Conditions Section
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#333').text('TERMS & CONDITIONS', leftMargin, yPos);
      yPos += 14;
      doc.fontSize(8).font('Helvetica').fillColor('#666');
      doc.text('1) This subscription is non-refundable once activated.', leftMargin, yPos);
      yPos += 11;
      doc.text('2) Money refund is generally not possible; exceptions may apply only if required by law.', leftMargin, yPos);
      yPos += 11;
      doc.text('3) Subscriptions are non-transferable between companies.', leftMargin, yPos);
      yPos += 18;
      
      // Contact Information Footer with border
      doc.rect(leftMargin, yPos, rightMargin - leftMargin, 35).stroke('#ddd');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ff8200').text('SUPPORT & CONTACT', leftMargin + 8, yPos + 5);
      doc.fontSize(8).font('Helvetica').fillColor('#333');
      doc.text('Email: support@kgamify.in', leftMargin + 8, yPos + 16);
      doc.text('Website: https://kgamify-job.onrender.com/', leftMargin + 8, yPos + 24);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateInvoicePdfBuffer };
