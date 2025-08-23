const AuditLog = require('../models/AuditLog');

/**
 * Middleware to log admin actions
 * @param {Object} options - Options for logging
 * @param {String} options.action - The action being performed
 * @param {String} options.entityType - The type of entity being acted upon
 * @returns {Function} Express middleware function
 */
const auditLogger = (options) => {
  return async (req, res, next) => {
    // Store the original send function
    const originalSend = res.send;
    
    // Override the send function to log after successful response
    res.send = function(body) {
      try {
        // Only log if response is successful (status 2xx)
        if (res.statusCode >= 200 && res.statusCode < 300 && req.admin) {
          const entityId = req.params.id || 
                          (req.body._id) || 
                          (typeof body === 'string' ? JSON.parse(body)?._id : body?._id);
          
          // Create log entry
          AuditLog.create({
            adminId: req.admin._id,
            action: options.action,
            entityType: options.entityType,
            entityId: entityId || 'N/A',
            details: {
              body: req.body,
              params: req.params,
              query: req.query
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }).catch(err => {
            // Silent fail - don't block response for logging errors
            if (process.env.NODE_ENV !== 'production') {
              console.error('Audit log error:', err);
            }
          });
        }
      } catch (err) {
        // Silent fail - don't block response
        if (process.env.NODE_ENV !== 'production') {
          console.error('Audit logging error:', err);
        }
      }
      
      // Call the original send function
      originalSend.apply(res, arguments);
      return res;
    };
    
    next();
  };
};

/**
 * Log admin actions directly (for non-middleware use)
 * @param {Object} options - Log details
 */
const logAdminAction = async (options) => {
  try {
    await AuditLog.create({
      adminId: options.adminId,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId || 'N/A',
      details: options.details || {},
      ipAddress: options.ipAddress || 'N/A',
      userAgent: options.userAgent || 'N/A'
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Direct audit logging error:', err);
    }
  }
};

module.exports = {
  auditLogger,
  logAdminAction
};
