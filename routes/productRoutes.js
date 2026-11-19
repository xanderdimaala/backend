import express from 'express';
import * as productControllers from '../controllers/productControllers.js';

const router = express.Router();

// 2.1.2 Catalog Browsing & 2.1.1 Product CRUD
router.get('/', productControllers.getAllProducts);
router.get('/stock-logs', productControllers.getStockLogs);
router.get('/:id', productControllers.getProductById);

// 2.1.1 Implement product create, update, delete
router.post('/', productControllers.createProduct);
router.put('/:id', productControllers.updateProduct);
router.delete('/:id', productControllers.deleteProduct);

// 2.2.1 Record stock-in and stock adjustments
router.post('/:id/stock-in', productControllers.stockIn);
router.post('/:id/adjust', productControllers.adjustStock);

// 2.2.2 Automatic stock deduction upon completed sale
router.post('/deduct-sale', productControllers.deductOrderStock);

export default router;
