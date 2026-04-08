const express = require('express');
const router = express.Router();

const ChatHistory = require('../models/ChatHistory');
const SupportTicket = require('../models/SupportTicket');
const { sendEmail } = require('../utils/emailService');
const { adminAuth } = require('../middleware/auth');

const SUPPORT_ADMIN_EMAIL = process.env.SUPPORT_ADMIN_EMAIL || 'admin@kgamify.com';

function sanitizeText(value, maxLen = 4000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function buildTicketNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TKT-${y}${m}${d}-${rand}`;
}

async function appendChatMessage({ companyEmail, companyName, role, text }) {
  if (!companyEmail || !text || !role) return null;
  const message = { role, text: sanitizeText(text), createdAt: new Date() };

  const history = await ChatHistory.findOneAndUpdate(
    { companyEmail },
    {
      $setOnInsert: { companyEmail },
      $set: { companyName: companyName || '', updatedAt: new Date() },
      $push: {
        messages: {
          $each: [message],
          $slice: -200
        }
      }
    },
    { upsert: true, new: true }
  );

  return history;
}

router.get('/chat-history', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });

    const history = await ChatHistory.findOne({ companyEmail: email }).lean();
    return res.json({
      companyEmail: email,
      companyName: history?.companyName || '',
      messages: Array.isArray(history?.messages) ? history.messages : []
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load chat history', details: error.message });
  }
});

router.post('/chat-history/message', async (req, res) => {
  try {
    const { email, companyName, role, text } = req.body || {};
    if (!email || !role || !text) {
      return res.status(400).json({ error: 'email, role and text are required' });
    }

    const history = await appendChatMessage({
      companyEmail: email,
      companyName,
      role,
      text
    });

    return res.json({ success: true, count: history?.messages?.length || 0 });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save chat message', details: error.message });
  }
});

router.post('/tickets/raise', async (req, res) => {
  try {
    const { email, companyName, issueSummary, transcript } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });

    const summary = sanitizeText(issueSummary, 1500);
    if (!summary) return res.status(400).json({ error: 'issueSummary required' });

    const history = await ChatHistory.findOne({ companyEmail: email }).lean();
    const transcriptSafe = Array.isArray(transcript) && transcript.length
      ? transcript
          .map((m) => ({
            role: ['user', 'ai', 'system'].includes(m?.role) ? m.role : 'user',
            text: sanitizeText(m?.text),
            createdAt: m?.createdAt ? new Date(m.createdAt) : new Date()
          }))
          .filter((m) => m.text)
          .slice(-50)
      : (Array.isArray(history?.messages) ? history.messages.slice(-50) : []);

    const ticket = await SupportTicket.create({
      ticketNumber: buildTicketNumber(),
      companyEmail: email,
      companyName: sanitizeText(companyName || history?.companyName || '', 120),
      issueSummary: summary,
      source: 'chatbot',
      status: 'open',
      transcript: transcriptSafe
    });

    const transcriptText = transcriptSafe
      .map((m) => `[${m.role}] ${m.text}`)
      .join('\n')
      .slice(0, 12000);

    sendEmail(SUPPORT_ADMIN_EMAIL, 'custom', {
      subject: `New Support Ticket ${ticket.ticketNumber} - ${ticket.companyName || email}`,
      html: `<p>A new support ticket has been raised from chatbot escalation.</p>
        <p><strong>Ticket:</strong> ${ticket.ticketNumber}</p>
        <p><strong>Company:</strong> ${ticket.companyName || 'N/A'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Issue:</strong> ${summary}</p>
        <p><strong>Transcript:</strong></p>
        <pre style="white-space:pre-wrap;font-family:monospace;background:#f8fafc;padding:10px;border-radius:8px;border:1px solid #e5e7eb;">${transcriptText}</pre>`
    }).catch(() => {});

    sendEmail(email, 'custom', {
      subject: `Support Ticket Raised (${ticket.ticketNumber}) - kGamify`,
      html: `<p>Hi ${ticket.companyName || 'there'},</p>
        <p>Your support ticket has been raised successfully.</p>
        <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
        <p><strong>Issue:</strong> ${summary}</p>
        <p>Our team will review this and reply within <strong>24 hours</strong>.</p>`
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        issueSummary: ticket.issueSummary,
        createdAt: ticket.createdAt
      },
      message: 'Ticket raised. You will get a reply within 24 hours.'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to raise support ticket', details: error.message });
  }
});

router.get('/tickets', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email required' });

    const tickets = await SupportTicket.find({ companyEmail: email })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      tickets: tickets.map((t) => ({
        _id: t._id,
        ticketNumber: t.ticketNumber,
        issueSummary: t.issueSummary,
        status: t.status,
        source: t.source,
        resolutionNote: t.resolutionNote || '',
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        transcript: t.transcript || []
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch tickets', details: error.message });
  }
});

router.get('/admin/tickets', adminAuth, async (req, res) => {
  try {
    const { status, q } = req.query;
    const filter = {};
    if (status && ['open', 'in-progress', 'resolved'].includes(status)) filter.status = status;
    if (q) {
      filter.$or = [
        { companyName: { $regex: new RegExp(q, 'i') } },
        { companyEmail: { $regex: new RegExp(q, 'i') } },
        { ticketNumber: { $regex: new RegExp(q, 'i') } },
        { issueSummary: { $regex: new RegExp(q, 'i') } }
      ];
    }

    const tickets = await SupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ tickets });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch admin tickets', details: error.message });
  }
});

router.patch('/admin/tickets/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNote } = req.body || {};
    if (!['open', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { status, resolutionNote: sanitizeText(resolutionNote || '', 3000) },
      { new: true }
    );

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (status === 'resolved' && ticket.companyEmail) {
      sendEmail(ticket.companyEmail, 'custom', {
        subject: `Ticket ${ticket.ticketNumber} Resolved - kGamify`,
        html: `<p>Hi ${ticket.companyName || 'there'},</p>
          <p>Your support ticket <strong>${ticket.ticketNumber}</strong> has been marked as resolved.</p>
          ${ticket.resolutionNote ? `<p><strong>Resolution note:</strong> ${ticket.resolutionNote}</p>` : ''}`
      }).catch(() => {});
    }

    return res.json({ success: true, ticket });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update ticket', details: error.message });
  }
});

module.exports = router;
