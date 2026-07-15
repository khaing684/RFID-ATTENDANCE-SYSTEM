/**
 * Simple Validators
 * Database ထဲ data အမှားတွေ မဝင်အောင် front gate က စစ်မယ်
 */

// Register validation
const validateRegister = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name is required (min 2 characters)' });
  }

  if (!data.email || !data.email.includes('@')) {
    errors.push({ field: 'email', message: 'Valid email is required' });
  }

  if (!data.password || data.password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  }

  return errors;
};

// Login validation
const validateLogin = (data) => {
  const errors = [];

  if (!data.email) errors.push({ field: 'email', message: 'Email is required' });
  if (!data.password) errors.push({ field: 'password', message: 'Password is required' });

  return errors;
};

// Tag validation
const validateTag = (data) => {
  const errors = [];

  if (!data.rfidCode || data.rfidCode.trim().length === 0) {
    errors.push({ field: 'rfidCode', message: 'RFID code is required' });
  }

  return errors;
};

// Device validation
const validateDevice = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Device name is required (min 2 characters)' });
  }

  if (!data.deviceCode || data.deviceCode.trim().length === 0) {
    errors.push({ field: 'deviceCode', message: 'Device code is required' });
  }

  return errors;
};

// ScanLog validation
const validateScanLog = (data) => {
  const errors = [];

  if (!data.rfidCode) errors.push({ field: 'rfidCode', message: 'RFID code is required' });
  if (!data.deviceCode) errors.push({ field: 'deviceCode', message: 'Device code is required' });

  return errors;
};

/**
 * Middleware helper - validation error တွေ့ရင် 400 response ပြန်
 */
const validate = (validatorFn) => {
  return (req, res, next) => {
    const errors = validatorFn(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
};

module.exports = {
  validateRegister,
  validateLogin,
  validateTag,
  validateDevice,
  validateScanLog,
  validate,
};
