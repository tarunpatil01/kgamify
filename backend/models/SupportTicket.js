const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'ai', 'system', 'admin'], required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  by: { type: String, default: '' }
}, { _id: false });

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true, index: true },
  companyEmail: { type: String, required: true, index: true },
  companyName: { type: String, default: '' },
  issueSummary: { type: String, required: true },
  source: { type: String, enum: ['chatbot', 'portal'], default: 'chatbot' },
  status: { type: String, enum: ['open', 'in-progress', 'resolved'], default: 'open' },
  transcript: { type: [ticketMessageSchema], default: [] },
  messages: { type: [ticketMessageSchema], default: [] },
  resolutionNote: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
