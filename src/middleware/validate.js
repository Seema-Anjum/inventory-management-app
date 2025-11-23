const { body, validationResult } = require('express-validator');

const validateUpdate = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('unit').trim().notEmpty().withMessage('Unit is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be integer >= 0'),
  // status optional but if provided must be in set
  body('status').optional().isIn(['in_stock', 'out_of_stock']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

module.exports = { validateUpdate };
