const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    email: { type: String, index: true, required: true }, // recipient email
    type: { type: String, default: 'info' },
    title: { type: String },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, index: true },
    meta: { type: Object },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('Notification', NotificationSchema);
