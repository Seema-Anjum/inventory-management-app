const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const productRoutes = require('./src/routes/productRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const path = require('path');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Serve uploaded images/files optionally
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/products', productRoutes);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Inventory API running on port ${PORT}`));
