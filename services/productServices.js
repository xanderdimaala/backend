import * as productModel from '../models/productModel.js';

// Auto generate product code if not provided
const generateProductCode = async (category, isWholesale) => {
    const prefix = isWholesale ? 'WH' : 'RT';
    const catCode = (category || 'GEN').substring(0, 2).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `AM-${prefix}-${catCode}-${rand}`;
};

export const getAllProducts = async (filters) => {
    return await productModel.fetchAll(filters);
};

export const getProductById = async (id) => {
    const product = await productModel.findById(id);
    if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
    }
    return product;
};

export const createProduct = async (data) => {
    const { name, category, packaging_unit, unit_cost, selling_price, stock } = data;

    if (!name || !name.trim()) {
        const err = new Error('Product name is required.');
        err.statusCode = 400;
        throw err;
    }
    if (!category || !category.trim()) {
        const err = new Error('Category is required (e.g. Laundry, Kitchen, Surface Cleaners, Bleach).');
        err.statusCode = 400;
        throw err;
    }
    if (!packaging_unit || !packaging_unit.trim()) {
        const err = new Error('Packaging unit is required (e.g. Retail Pack, Bottle, Gallon, Kahon-kahon Box).');
        err.statusCode = 400;
        throw err;
    }

    const costNum = parseFloat(unit_cost);
    const priceNum = parseFloat(selling_price);
    const stockNum = parseInt(stock, 10);

    if (isNaN(costNum) || costNum < 0) {
        const err = new Error('Unit cost must be a valid non-negative number.');
        err.statusCode = 400;
        throw err;
    }
    if (isNaN(priceNum) || priceNum < 0) {
        const err = new Error('Selling price must be a valid non-negative number.');
        err.statusCode = 400;
        throw err;
    }
    if (isNaN(stockNum) || stockNum < 0) {
        const err = new Error('Stock must be a non-negative integer.');
        err.statusCode = 400;
        throw err;
    }

    // Auto-detect wholesale if contains 'kahon' or 'box'
    const isWholesale = data.is_wholesale !== undefined
        ? Boolean(data.is_wholesale)
        : /kahon|box|wholesale/i.test(packaging_unit) || /kahon|box|wholesale/i.test(name);

    let code = (data.code || '').trim();
    if (!code) {
        code = await generateProductCode(category, isWholesale);
    } else {
        const existing = await productModel.findByCode(code);
        if (existing) {
            const err = new Error(`Product code "${code}" already exists.`);
            err.statusCode = 400;
            throw err;
        }
    }

    const newProduct = {
        code,
        name: name.trim(),
        category: category.trim(),
        packaging_unit: packaging_unit.trim(),
        is_wholesale: isWholesale ? 1 : 0,
        unit_cost: costNum,
        selling_price: priceNum,
        stock: stockNum,
        low_stock_threshold: parseInt(data.low_stock_threshold, 10) || 10,
        active: data.active !== undefined ? (data.active ? 1 : 0) : 1,
        image: data.image || '',
        description: (data.description || '').trim()
    };

    const insertId = await productModel.insert(newProduct);
    return { id: insertId, code, ...newProduct };
};

export const updateProduct = async (id, data) => {
    const existing = await productModel.findById(id);
    if (!existing) {
        const err = new Error('Product not found to update.');
        err.statusCode = 404;
        throw err;
    }

    const { name, category, packaging_unit, unit_cost, selling_price, stock } = data;

    if (!name || !name.trim()) throw new Error('Product name is required.');
    if (!category || !category.trim()) throw new Error('Category is required.');
    if (!packaging_unit || !packaging_unit.trim()) throw new Error('Packaging unit is required.');

    const costNum = parseFloat(unit_cost !== undefined ? unit_cost : existing.unit_cost);
    const priceNum = parseFloat(selling_price !== undefined ? selling_price : existing.selling_price);
    const stockNum = parseInt(stock !== undefined ? stock : existing.stock, 10);

    if (isNaN(costNum) || costNum < 0) throw new Error('Valid unit cost is required.');
    if (isNaN(priceNum) || priceNum < 0) throw new Error('Valid selling price is required.');
    if (isNaN(stockNum) || stockNum < 0) throw new Error('Valid stock is required.');

    const isWholesale = data.is_wholesale !== undefined
        ? Boolean(data.is_wholesale)
        : /kahon|box|wholesale/i.test(packaging_unit) || /kahon|box|wholesale/i.test(name);

    const updated = {
        name: name.trim(),
        category: category.trim(),
        packaging_unit: packaging_unit.trim(),
        is_wholesale: isWholesale ? 1 : 0,
        unit_cost: costNum,
        selling_price: priceNum,
        stock: stockNum,
        low_stock_threshold: parseInt(data.low_stock_threshold !== undefined ? data.low_stock_threshold : existing.low_stock_threshold, 10) || 10,
        active: data.active !== undefined ? (data.active ? 1 : 0) : existing.active,
        image: data.image !== undefined ? data.image : existing.image,
        description: data.description !== undefined ? data.description.trim() : existing.description
    };

    // If stock changed directly via edit, record adjustment audit
    if (stockNum !== existing.stock) {
        const delta = stockNum - existing.stock;
        await productModel.logStockChange({
            product_id: id,
            action_type: delta > 0 ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_SUB',
            quantity: Math.abs(delta),
            prev_stock: existing.stock,
            new_stock: stockNum,
            remarks: data.remarks || 'Manual adjustment via product edit',
            performed_by: data.performed_by || 'Admin'
        });
    }

    await productModel.update(id, updated);
    return { id: parseInt(id, 10), ...updated };
};

export const deleteProduct = async (id) => {
    const existing = await productModel.findById(id);
    if (!existing) {
        const err = new Error('Product not found.');
        err.statusCode = 404;
        throw err;
    }
    await productModel.remove(id);
    return { success: true, message: `Product "${existing.name}" deleted successfully.` };
};

// Record Stock-in (Restock)
export const stockIn = async (id, quantity, remarks = 'Restock', performedBy = 'Admin') => {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
        const err = new Error('Restock quantity must be a positive integer.');
        err.statusCode = 400;
        throw err;
    }
    const result = await productModel.updateStockQty(id, qty, 'STOCK_IN', remarks, performedBy);
    return { success: true, id, addedQty: qty, ...result };
};

// Record Manual Stock Adjustment
export const adjustStock = async (id, delta, remarks = 'Inventory adjustment', performedBy = 'Admin') => {
    const d = parseInt(delta, 10);
    if (isNaN(d) || d === 0) {
        const err = new Error('Adjustment delta cannot be zero.');
        err.statusCode = 400;
        throw err;
    }
    const actionType = d > 0 ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_SUB';
    const result = await productModel.updateStockQty(id, d, actionType, remarks, performedBy);
    return { success: true, id, delta: d, ...result };
};

// Automatic Stock Deduction upon completed sale
export const deductForOrder = async (items, orderCode, performedBy) => {
    if (!Array.isArray(items) || items.length === 0) {
        const err = new Error('Order items list cannot be empty for stock deduction.');
        err.statusCode = 400;
        throw err;
    }
    return await productModel.deductOrderStock(items, orderCode, performedBy);
};

// Fetch stock logs / audit trail
export const getStockAuditLogs = async (productId, limit) => {
    return await productModel.getStockLogs(productId, limit);
};
