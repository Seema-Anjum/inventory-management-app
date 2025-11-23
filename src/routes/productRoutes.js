const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const controller = require('../controllers/productController');
const { validateUpdate } = require('../middleware/validate');

const upload = multer({ dest: path.join(__dirname, '../../uploads/') });

// List products 
router.get('/', controller.getProducts);

// Search by name (can use same endpoint /api/products?search=)
router.get('/search', controller.searchProducts);

// Import CSV
router.post('/import', upload.single('csvFile'), controller.importCSV);

// Export CSV
router.get('/export', controller.exportCSV);

// Update product
router.put('/:id', validateUpdate, controller.updateProduct);

// Delete product
router.delete('/:id', controller.deleteProduct);

// Get history
router.get('/:id/history', controller.getHistory);

module.exports = router;
