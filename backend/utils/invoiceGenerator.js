// Professional invoice generator with itemized breakdown and GST
const PDFDocument = require('pdfkit');

function formatAmount(amount, currency = 'INR') {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}

function generateInvoiceHtml({
  invoiceId,
  brand = 'kGamify',
  logoUrl,
  sellerName,
  sellerAddress,
  sellerGSTIN,
  sellerHSN,
  companyName,
  companyEmail,
  companyAddress,
  companyGSTIN,
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
  const issued = new Date(issuedAt).toLocaleDateString('en-GB');
  const billStart = billingStartDate ? new Date(billingStartDate).toLocaleDateString('en-GB') : 'N/A';
  const billEnd = billingEndDate ? new Date(billingEndDate).toLocaleDateString('en-GB') : 'N/A';
  const nextBill = nextBillingDate ? new Date(nextBillingDate).toLocaleDateString('en-GB') : 'N/A';

  // Generate table rows HTML
  let itemsHtml = '';
  if (Array.isArray(billingItems) && billingItems.length > 0) {
    itemsHtml = billingItems.map((item, idx) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${item.description || 'Item ' + (idx + 1)}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.units || 1}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatAmount(item.unitPrice || 0, currency)}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatAmount((item.units || 1) * (item.unitPrice || 0), currency)}</td>
      </tr>
    `).join('');
  }

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8"/>
      <title>Invoice ${invoiceId}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; background: #f5f5f5; }
        .container { max-width: 900px; margin: 20px auto; background: white; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #ff8200; padding-bottom: 20px; }
        .logo { width: 60px; height: 60px; }
        .header-right { text-align: right; }
        .header-right h1 { font-size: 36px; font-weight: bold; color: #333; margin-bottom: 5px; }
        .header-info { color: #666; font-size: 13px; line-height: 1.6; }
        .header-info strong { color: #ff8200; display: block; margin-top: 8px; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .detail-section { }
        .detail-section h3 { font-size: 12px; color: #999; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; margin-bottom: 8px; }
        .detail-section p { font-size: 13px; line-height: 1.6; color: #333; margin-bottom: 3px; }
        .detail-section .gstin { font-size: 12px; color: #666; margin-top: 5px; }
        .subscription-info { grid-column: 2; }
        .subscription-info p { font-size: 13px; }
        .subscription-info strong { color: #ff8200; }
        table { width: 100%; border-collapse: collapse; margin: 30px 0; font-size: 13px; }
        th { background: #f9f9f9; padding: 12px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #ff8200; color: #333; }
        th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: center; }
        td { padding: 12px 10px; border-bottom: 1px solid #eee; }
        td:nth-child(2), td:nth-child(3), td:nth-child(4) { text-align: right; }
        .totals { width: 100%; margin-top: 30px; }
        .total-row { display: flex; justify-content: flex-end; margin-bottom: 12px; font-size: 13px; }
        .total-label { width: 250px; text-align: right; padding-right: 20px; }
        .total-value { width: 150px; text-align: right; font-weight: 500; }
        .total-row.subtotal .total-label { color: #666; }
        .total-row.gst .total-label { color: #666; }
        .total-row.final { border-top: 2px solid #ff8200; padding-top: 12px; font-weight: bold; font-size: 14px; }
        .total-row.final .total-value { color: #ff8200; font-size: 16px; }
        .amount-due { background: #fff8f0; border: 2px solid #ff8200; padding: 20px; margin-top: 30px; text-align: center; border-radius: 4px; }
        .amount-due-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .amount-due-value { font-size: 28px; font-weight: bold; color: #ff8200; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div>
            ${logoUrl ? `<img src="${logoUrl}" alt="${brand}" class="logo" style="border-radius: 4px; object-fit: contain;" />` : `<div style="width: 60px; height: 60px; background: #ff8200; border-radius: 4px;"></div>`}
          </div>
          <div class="header-right">
            <h1>INVOICE</h1>
            <div class="header-info">
              <strong>Invoice # ${invoiceId}</strong>
              Invoice Date  ${issued}
              <br/>Invoice Amount  ${formatAmount(total, currency)}
              <br/><span style="color: #ff8200; font-weight: 600; margin-top: 8px; display: block;">PAYMENT DUE</span>
            </div>
          </div>
        </div>

        <!-- Seller & Billing Details -->
        <div class="details-grid">
          <div>
            <div class="detail-section">
              <h3>From</h3>
              <p style="font-weight: 600; font-size: 14px;">${sellerName || 'kGamify'}</p>
              <p>${sellerAddress || ''}</p>
              ${sellerHSN ? `<p class="gstin">HSN / SAC: ${sellerHSN}</p>` : ''}
              ${sellerGSTIN ? `<p class="gstin">GSTIN: ${sellerGSTIN}</p>` : ''}
            </div>

            <div class="detail-section" style="margin-top: 20px;">
              <h3>Billed To</h3>
              <p style="font-weight: 600; font-size: 14px;">${companyName || companyEmail}</p>
              <p>${companyAddress || ''}</p>
              ${companyGSTIN ? `<p class="gstin">GSTIN: ${companyGSTIN}</p>` : ''}
            </div>
          </div>

          <div class="subscription-info">
            <h3>Subscription</h3>
            <p>Billing Period: <strong>${billStart}</strong> to <strong>${billEnd}</strong></p>
            <p>Next Billing Date: <strong>${nextBill}</strong></p>
          </div>
        </div>

        <!-- Items Table -->
        <table>
          <thead>
            <tr>
              <th>DESCRIPTION</th>
              <th>UNITS</th>
              <th>UNIT PRICE</th>
              <th>AMOUNT (INR)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
          <div class="total-row subtotal">
            <div class="total-label">Sub Total</div>
            <div class="total-value">${formatAmount(subtotal, currency)}</div>
          </div>
          <div class="total-row gst">
            <div class="total-label">IGST @ ${gstRate}%</div>
            <div class="total-value">${formatAmount(gstAmount, currency)}</div>
          </div>
          <div class="total-row final">
            <div class="total-label">Total</div>
            <div class="total-value">${formatAmount(total, currency)}</div>
          </div>
        </div>

        <!-- Amount Due Box -->
        <div class="amount-due">
          <div class="amount-due-label">Amount Due (INR)</div>
          <div class="amount-due-value">${formatAmount(total, currency)}</div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>Terms & Conditions:</strong></p>
          <p>1) This subscription is <strong>non-refundable</strong> once activated.</p>
          <p>2) Money refund is generally <strong>not possible</strong>; exceptions may apply only if required by law.</p>
          <p>3) Subscriptions are <strong>non-transferable</strong> between companies.</p>
        </div>
      </div>
    </body>
  </html>`;
}

function generateInvoicePdfBuffer({
  invoiceId,
  brand = 'kGamify',
  companyName,
  companyEmail,
  plan,
  amount,
  currency = 'INR',
  startAt,
  endAt,
  issuedAt = new Date()
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      const chunks = [];
      doc.on('data', (d) => chunks.push(d));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(32).font('Helvetica-Bold').text('INVOICE', { align: 'right' });
      doc.fontSize(10).font('Helvetica').fillColor('#666').text(`Invoice ID: ${invoiceId}`, { align: 'right' });
      doc.text(`Issued: ${new Date(issuedAt).toLocaleDateString('en-GB')}`, { align: 'right' });

      doc.moveDown(1);

      // From section
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text('From');
      doc.fontSize(10).font('Helvetica').text(`${brand}`);
      doc.text('');

      // Billed To section
      doc.fontSize(11).font('Helvetica-Bold').text('Billed To');
      doc.fontSize(10).font('Helvetica').text(companyName || companyEmail || '');
      if (companyEmail) doc.text(companyEmail);

      doc.moveDown(1);

      // Amount
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#ff8200').text(`Total: ${formatAmount(amount, currency)}`);
      
      doc.moveDown(0.5);
      doc.rect(0, doc.y, doc.page.width, 60).stroke();
      doc.fontSize(8).fillColor('#666').text('Terms & Conditions:', 10, doc.y + 5);
      doc.fontSize(7).text('1) This subscription is non-refundable once activated.\n2) Money refund is generally not possible.\n3) Subscriptions are non-transferable between companies.', 10, doc.y + 15);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateInvoiceHtml, generateInvoicePdfBuffer };
