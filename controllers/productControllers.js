import * as productServices from '../services/productServices.js';

// GET /product or /api/products
export const getAllProducts = async (req, res) => {
    try {
        const { activeOnly, category, isWholesale, search } = req.query;
        const filters = {
            activeOnly: activeOnly === 'true' || activeOnly === '1',
            category,
            isWholesale: isWholesale !== undefined ? (isWholesale === 'true' || isWholesale === '1') : null,
            search
        };
        const products = await productServices.getAllProducts(filters);
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (e) {
        console.error('Error fetching products:', e);
        res.status(e.statusCode || 500).json({ success: false, error: e.message || 'Internal Server Error' });
    }
};

// GET /product/:id
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productServices.getProductById(id);
        res.status(200).json({ success: true, data: product });
    } catch (e) {
        res.status(e.statusCode || 500).json({ success: false, error: e.message || 'Internal Server Error' });
    }
};

// POST /product (Create new product)
export const createProduct = async (req, res) => {
    try {
        const created = await productServices.createProduct(req.body);
        res.status(201).json({ success: true, message: 'Product created successfully', data: created });
    } catch (e) {
        console.error('Error creating product:', e);
        res.status(e.statusCode || 500).json({ success: false, error: e.message || 'Internal Server Error' });
    }
};

// PUT /product/:id (Update product)
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await productServices.updateProduct(id, req.body);
        res.status(200).json({ success: true, message: 'Product updated successfully', data: updated });
    } catch (e) {
        console.error('Error updating product:', e);
        res.status(e.statusCode || 500).json({ success: false, error: e.message || 'Internal Server Error' });
    }
};

// DELETE /product/:id (Delete product)
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await productServices.deleteProduct(id);
        res.status(200).json({ success: true, message: result.message });
    } catch (e) {
        console.error('Error deleting product:', e);
        res.status(e.statusCode || 500).json({ success: false, error: e.message || 'Internal Server Error' });
    }
};

// POST /product/:id/stock-in (Restock inventory)
export const stockIn = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, remarks, performedBy } = req.body;
        const result = await productServices.stockIn(id, quantity, remarks, performedBy);
        res.status(200).json({ success: true, message: 'Stock-in recorded successfully', data: result });
    } catch (e) {
        console.error('Error in stock-in:', e);
        res.status(e.statusCode || 500).json({ success: false, error: e.message || 'Internal Server Error' });
    }
};

// POST /product/:id/adjust (Manual adjustment)
export const adjustStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { delta, remarks, performedBy } = req.body;
        const result = await productServices.adjustStock(id, delta, remarks, performedBy);
        res.status(200).json({ success: true, message: 'Stock adjustment recorded successfully', data: result });
    } catch (e) {
        console.error('Error adjusting stock:', e);
        res.status(e.statusCode || 500).json({ success: false, error: e.message || 'Internal Server Error' });
    }
};

// POST /product/deduct-sale (Automatic deduction on completed sale)
export const deductOrderStock = async (req, res) => {
    try {
        const { items, orderCode, performedBy } = req.body;
        const result = await productServices.deductForOrder(items, orderCode, performedBy);
        res.status(200).json({ success: true, message: 'Stock deducted for order successfully', data: result });
    } catch (e) {
        console.error('Error deducting stock for sale:', e);
        res.status(e.statusCode || 500).json({ success: false, error: e.message || 'Internal Server Error' });
    }
};

// GET /product/stock-logs (Audit trail)
export const getStockLogs = async (req, res) => {
    try {
        const { productId, limit } = req.query;
        const logs = await productServices.getStockAuditLogs(productId ? parseInt(productId, 10) : null, limit || 50);
        res.status(200).json({ success: true, count: logs.length, data: logs });
    } catch (e) {
        console.error('Error fetching stock logs:', e);
        res.status(e.statusCode || 500).json({ success: false, error: e.message || 'Internal Server Error' });
    }
};
