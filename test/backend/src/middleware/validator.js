const { validationResult } = require('express-validator');

const validator = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const errorMessages = errors.array().map((err) => {
    if (err.type === 'field') {
      return `${err.path}: ${err.msg}`;
    }
    return err.msg;
  });

  return res.status(400).json({
    code: 400,
    message: errorMessages[0],
    data: null,
    errors: errors.array()
  });
};

module.exports = validator;
