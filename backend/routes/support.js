const express = require('express');
const router = express.Router();

const ChatHistory = require('../models/ChatHistory');
const SupportTicket = require('../models/SupportTicket');
const { sendEmail } = require('../utils/emailService');
const { adminAuth } = require('../middleware/auth');

const REQUIRED_SUPPORT_ADMIN_EMAIL = 'admin@kgamify.in';
const SUPPORT_ADMIN_EMAIL = process.env.SUPPORT_ADMIN_EMAIL || REQUIRED_SUPPORT_ADMIN_EMAIL;

function getSupportAdminRecipients() {
  return [...new Set([REQUIRED_SUPPORT_ADMIN_EMAIL, SUPPORT_ADMIN_EMAIL].filter(Boolean))];
}

function notifySupportAdmins(payload) {
  const recipients = getSupportAdminRecipients();
  recipients.forEach((recipient) => {
    sendEmail(recipient, 'custom', payload).catch(() => {});
  });
}

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(value || '');
  }
}

function sanitizeText(value, maxLen = 4000) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function getIo(req) {
  try {
    return req.app.get('io');
  } catch {
    return null;
  }
}

function emitTicketUpdate(req, ticketId, payload) {
  const io = getIo(req);
  if (!io || !ticketId) return;
  io.to(`ticket:${ticketId}`).emit('ticket:message', payload);
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
      transcript: transcriptSafe,
      messages: [
        {
          role: 'system',
          text: 'Support ticket created from chatbot escalation.',
          by: 'system',
          createdAt: new Date()
        }
      ]
    });

    const transcriptText = transcriptSafe
      .map((m) => `[${m.role}] ${m.text}`)
      .join('\n')
      .slice(0, 12000);

    notifySupportAdmins({
      subject: `New Support Ticket ${ticket.ticketNumber} | ${ticket.companyName || email}`,
      html: `<div style="font-family:Segoe UI,Arial,sans-serif;color:#111827;line-height:1.5;max-width:760px;margin:0 auto;">
        <h2 style="margin:0 0 14px;color:#1f2937;">New Support Ticket Raised</h2>
        <p style="margin:0 0 12px;">Dear Support Team,</p>
        <p style="margin:0 0 12px;">A support ticket has been raised through the kGamify chatbot and requires your review.</p>
        <table style="border-collapse:collapse;width:100%;margin:10px 0 14px;">
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Ticket Number</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${ticket.ticketNumber}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Created At</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${formatDateTime(ticket.createdAt)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Company</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${ticket.companyName || 'N/A'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Company Email</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Issue Summary</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${summary}</td></tr>
        </table>
        <p style="margin:0 0 8px;"><strong>Conversation Transcript:</strong></p>
        <pre style="white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e5e7eb;">${transcriptText}</pre>
        <p style="margin:12px 0 0;">Please acknowledge and respond as per SLA policy.</p>
        <p style="margin:16px 0 0;">Regards,<br/>kGamify Support Automation</p>
      </div>`
    });

    sendEmail(email, 'custom', {
      subject: `Support Ticket Raised (${ticket.ticketNumber}) - kGamify`,
      html: `<div style="font-family:Segoe UI,Arial,sans-serif;color:#111827;line-height:1.5;max-width:720px;margin:0 auto;">
        <h2 style="margin:0 0 14px;color:#1f2937;">Support Request Received</h2>
        <p style="margin:0 0 12px;">Dear ${ticket.companyName || 'Team'},</p>
        <p style="margin:0 0 12px;">Thank you for contacting kGamify Support. Your request has been successfully logged.</p>
        <table style="border-collapse:collapse;width:100%;margin:10px 0 14px;">
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Ticket Number</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${ticket.ticketNumber}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Raised At</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${formatDateTime(ticket.createdAt)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Issue Summary</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${summary}</td></tr>
        </table>
        <p style="margin:0 0 12px;">Our support team will respond within <strong>24 hours</strong>.</p>
        <p style="margin:0;">Regards,<br/>kGamify Support Team</p>
      </div>`
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
        transcript: t.transcript || [],
        messages: t.messages || []
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch tickets', details: error.message });
  }
});

router.post('/tickets/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, text } = req.body || {};
    const clean = sanitizeText(text, 3000);

    if (!email) return res.status(400).json({ error: 'email required' });
    if (!clean) return res.status(400).json({ error: 'text required' });

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (String(ticket.companyEmail).toLowerCase() !== String(email).toLowerCase()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const msg = { role: 'user', text: clean, by: email, createdAt: new Date() };
    ticket.messages = Array.isArray(ticket.messages) ? ticket.messages : [];
    ticket.messages.push(msg);
    if (ticket.status === 'resolved') ticket.status = 'in-progress';
    await ticket.save();

    emitTicketUpdate(req, ticket._id.toString(), { ticketId: ticket._id, message: msg });

    notifySupportAdmins({
      subject: `Ticket Update ${ticket.ticketNumber} - New company message`,
      html: `<div style="font-family:Segoe UI,Arial,sans-serif;color:#111827;line-height:1.5;max-width:720px;margin:0 auto;">
        <p style="margin:0 0 10px;">Dear Support Team,</p>
        <p style="margin:0 0 10px;">A new company reply has been posted for ticket <strong>${ticket.ticketNumber}</strong>.</p>
        <p style="margin:0 0 6px;"><strong>Message:</strong></p>
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:10px;">${clean}</div>
      </div>`
    });

    return res.json({ success: true, message: msg });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to post ticket message', details: error.message });
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

    return res.json({ tickets: tickets.map((t) => ({ ...t, messages: t.messages || [] })) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch admin tickets', details: error.message });
  }
});

router.post('/admin/tickets/:id/messages', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body || {};
    const clean = sanitizeText(text, 3000);
    if (!clean) return res.status(400).json({ error: 'text required' });

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const msg = {
      role: 'admin',
      text: clean,
      by: req.admin?.email || 'admin',
      createdAt: new Date()
    };

    ticket.messages = Array.isArray(ticket.messages) ? ticket.messages : [];
    ticket.messages.push(msg);
    if (ticket.status === 'open') ticket.status = 'in-progress';
    await ticket.save();

    emitTicketUpdate(req, ticket._id.toString(), { ticketId: ticket._id, message: msg });

    if (ticket.companyEmail) {
      sendEmail(ticket.companyEmail, 'custom', {
        subject: `Update on your ticket ${ticket.ticketNumber} - kGamify`,
        html: `<p>Dear ${ticket.companyName || 'Team'},</p><p>Our support team has posted an update on your ticket <strong>${ticket.ticketNumber}</strong>.</p><p><strong>Message:</strong> ${clean}</p><p>Regards,<br/>kGamify Support Team</p>`
      }).catch(() => {});
    }

    return res.json({ success: true, message: msg });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to post admin ticket message', details: error.message });
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
