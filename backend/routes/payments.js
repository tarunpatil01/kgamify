const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Company = require('../models/Company');
const { sendEmail } = require('../utils/emailService');
const { activateSubscription } = require('./company');

const router = express.Router();

// Initialize Razorpay instance
function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('Razorpay keys are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment');
  }
  return new Razorpay({ key_id, key_secret });
}

// Pricing (keep in sync with company.js PLAN_PRICING)
const PLAN_PRICING = { free: 0, silver: 999, gold: 2999 };

// GET /api/payments/config -> publishable key for frontend
router.get('/config', (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID || '' });
});

// POST /api/payments/order { email, plan }
// Creates an order in Razorpay with notes carrying email & plan
router.post('/order', async (req, res) => {
  try {
    const { email, plan } = req.body || {};
    if (!email || !plan) return res.status(400).json({ error: 'email and plan required' });
    if (!['free','silver','gold'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
    const company = await Company.findOne({ email }, { email:1, companyName:1 });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const amountInINR = PLAN_PRICING[plan];
    const amountPaise = amountInINR * 100; // Razorpay uses smallest unit
    // For free plan, we can skip order creation and directly activate, but keep flow consistent

    const instance = getRazorpay();
    const order = await instance.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { email, plan }
    });

    return res.json({ orderId: order.id, amount: order.amount, currency: order.currency, email, plan, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('Create order error:', err);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// POST /api/payments/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature, email?, plan? }
// Verify client-side signature, as an optional fallback when webhooks are unavailable.
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, plan } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expected = hmac.digest('hex');

    if (expected !== razorpay_signature) return res.status(400).json({ error: 'Invalid signature' });

    // Fallback activation if we have email & plan (prefer webhooks)
    if (email && plan) {
      await activateSubscription({ email, plan, amount: PLAN_PRICING[plan], currency: 'INR', origin: 'client-verify', paymentId: razorpay_payment_id, orderId: razorpay_order_id });
    }

    return res.json({ success: true });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('Verify error:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// Webhook: must be mounted with express.raw({ type: 'application/json' }) BEFORE global json parser; we export a handler for server.js to use.
async function webhookHandler(req, res) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) return res.status(500).json({ error: 'Webhook secret not set' });

    const body = req.body; // raw buffer provided by express.raw
    const signature = req.headers['x-razorpay-signature'];

    const expected = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
    if (expected !== signature) return res.status(400).json({ error: 'Invalid webhook signature' });

    const payload = JSON.parse(body.toString('utf8'));
    const event = payload.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload.payload?.payment?.entity;
      const order = payload.payload?.order?.entity;
      const notes = (payment && payment.notes) || (order && order.notes) || {};
      const email = notes.email;
      const plan = notes.plan;

      if (email && plan && ['free','silver','gold'].includes(plan)) {
        await activateSubscription({ email, plan, amount: PLAN_PRICING[plan], currency: 'INR', origin: 'webhook', paymentId: payment?.id, orderId: order?.id });
      }
    }

    return res.json({ status: 'ok' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Export both the router (JSON endpoints) and the webhook handler
const paymentsModule = router;
paymentsModule.webhook = webhookHandler;
module.exports = paymentsModule;
