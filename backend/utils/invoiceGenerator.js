// Professional invoice generator with itemized breakdown and GST
const PDFDocument = require('pdfkit');

function formatAmount(amount, currency = 'INR') {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}

function generateInvoicePdfBuffer({
  invoiceId,
  sellerName = 'kGamify',
  sellerAddress = 'Electronic City, Bangalore',
  sellerGSTIN = '',
  sellerHSN = '',
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
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];
      doc.on('data', (d) => chunks.push(d));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Top border
      doc.rect(0, 0, doc.page.width, 5).fill('#ff8200');

      // Header section with INVOICE title
      doc.fontSize(32).font('Helvetica-Bold').fillColor('#000').text('INVOICE', 350, 30);
      
      // Invoice details on right
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#333').text(`Invoice #: ${invoiceId}`, 350, 70);
      doc.fontSize(10).font('Helvetica').fillColor('#666').text(`Issued: ${new Date(issuedAt).toLocaleDateString('en-GB')}`, 350, 85);
      doc.fontSize(10).fillColor('#ff8200').text(`Amount: ${formatAmount(total, currency)}`, 350, 100);
      doc.fontSize(9).fillColor('#ff8200').font('Helvetica-Bold').text('PAYMENT DUE', 350, 115);

      doc.moveTo(40, 135).lineTo(doc.page.width - 40, 135).stroke('#ff8200');

      // From section
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#333').text('From', 40, 155);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text(sellerName, 40, 175);
      doc.fontSize(10).font('Helvetica').fillColor('#666').text(sellerAddress, 40, 195);
      if (sellerHSN) {
        doc.fontSize(9).fillColor('#666').text(`HSN / SAC: ${sellerHSN}`, 40, 210);
      }
      if (sellerGSTIN) {
        doc.fontSize(9).fillColor('#666').text(`GSTIN: ${sellerGSTIN}`, 40, 223);
      }

      // Billed To section (right column)
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#333').text('Billed To', 350, 155);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text(companyName || companyEmail || 'Company', 350, 175);
      if (companyAddress) {
        doc.fontSize(10).font('Helvetica').fillColor('#666').text(companyAddress, 350, 195);
      } else {
        doc.fontSize(10).font('Helvetica').fillColor('#666').text(companyEmail || '', 350, 195);
      }
      if (companyGSTIN) {
        doc.fontSize(9).fillColor('#666').text(`GSTIN: ${companyGSTIN}`, 350, 210);
      }

      // Subscription info
      const billStart = billingStartDate ? new Date(billingStartDate).toLocaleDateString('en-GB') : 'N/A';
      const billEnd = billingEndDate ? new Date(billingEndDate).toLocaleDateString('en-GB') : 'N/A';
      const nextBill = nextBillingDate ? new Date(nextBillingDate).toLocaleDateString('en-GB') : 'N/A';

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#333').text('Billing Period', 40, 250);
      doc.fontSize(10).font('Helvetica').fillColor('#666').text(`${billStart} to ${billEnd}`, 40, 270);
      doc.fontSize(9).fillColor('#999').text(`Next Billing: ${nextBill}`, 40, 285);

      // Items table
      const tableTop = 320;
      const col1 = 40, col2 = 330, col3 = 430, col4 = 530;

      // Table header
      doc.rect(40, tableTop, doc.page.width - 80, 25).fill('#f9f9f9');
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#333').text('DESCRIPTION', col1, tableTop + 6);
      doc.text('UNITS', col2, tableTop + 6);
      doc.text('UNIT PRICE', col3, tableTop + 6);
      doc.text('AMOUNT (INR)', col4, tableTop + 6);

      // Table rows
      let yPos = tableTop + 30;
      if (Array.isArray(billingItems) && billingItems.length > 0) {
        billingItems.forEach((item) => {
          doc.fontSize(10).font('Helvetica').fillColor('#333').text(item.description || 'Item', col1, yPos);
          doc.text((item.units || 1).toString(), col2, yPos);
          doc.text(formatAmount(item.unitPrice || 0, currency), col3, yPos);
          const rowTotal = (item.units || 1) * (item.unitPrice || 0);
          doc.text(formatAmount(rowTotal, currency), col4, yPos);
          yPos += 25;
        });
      } else {
        // If no items, show a single default row
        doc.fontSize(10).font('Helvetica').fillColor('#333').text('Subscription Plan', col1, yPos);
        doc.text('1', col2, yPos);
        doc.text(formatAmount(subtotal || total, currency), col3, yPos);
        doc.text(formatAmount(subtotal || total, currency), col4, yPos);
        yPos += 25;
      }

      // Bottom line under table
      doc.moveTo(40, yPos).lineTo(doc.page.width - 40, yPos).stroke('#ddd');
      yPos += 15;

      // Totals section (right aligned)
      const totalsX = 380;
      const totalsValueX = 530;

      doc.fontSize(11).font('Helvetica').fillColor('#666').text('Sub Total', totalsX, yPos);
      doc.text(formatAmount(subtotal || total, currency), totalsValueX, yPos);
      yPos += 20;

      doc.fontSize(11).font('Helvetica').fillColor('#666').text(`IGST @ ${gstRate}%`, totalsX, yPos);
      doc.text(formatAmount(gstAmount, currency), totalsValueX, yPos);
      yPos += 20;

      // Total line
      doc.moveTo(totalsX, yPos).lineTo(doc.page.width - 40, yPos).stroke('#ff8200');
      yPos += 5;

      doc.fontSize(13).font('Helvetica-Bold').fillColor('#ff8200').text('Total', totalsX, yPos);
      doc.text(formatAmount(total, currency), totalsValueX, yPos);
      yPos += 25;

      // Amount Due Box
      const boxY = yPos + 10;
      doc.rect(60, boxY, doc.page.width - 120, 50).stroke('#ff8200');
      doc.rect(60, boxY, doc.page.width - 120, 50).fill('#fff8f0');
      doc.fontSize(10).font('Helvetica').fillColor('#666').text('Amount Due (INR)', 80, boxY + 8);
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#ff8200').text(formatAmount(total, currency), 80, boxY + 24);

      // Terms & Conditions at bottom
      const footerY = doc.page.height - 100;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text('Terms & Conditions:', 40, footerY);
      doc.fontSize(9).font('Helvetica').fillColor('#666').text('1) This subscription is non-refundable once activated.', 40, footerY + 15);
      doc.text('2) Money refund is generally not possible; exceptions may apply only if required by law.', 40, footerY + 28);
      doc.text('3) Subscriptions are non-transferable between companies.', 40, footerY + 41);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateInvoicePdfBuffer };
