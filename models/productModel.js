import pool from '../config/db.js';

// Retrieve all products with optional filters
export const fetchAll = async (filters = {}) => {
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (filters.activeOnly) {
        sql += ' AND active = 1';
    }
    if (filters.category && filters.category !== 'All') {
        sql += ' AND category = ?';
        params.push(filters.category);
    }
    if (filters.isWholesale !== undefined && filters.isWholesale !== null) {
        sql += ' AND is_wholesale = ?';
        params.push(filters.isWholesale ? 1 : 0);
    }
    if (filters.search) {
        sql += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
        const term = `%${filters.search}%`;
        params.push(term, term, term);
    }

    sql += ' ORDER BY is_wholesale ASC, id DESC';
    const [rows] = await pool.query(sql, params);
    return rows;
};

// Find single product by ID or Code
export const findById = async (id) => {
    const num = Number(id);
    if (!isNaN(num) && Number.isInteger(num)) {
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [num]);
        if (rows.length) return rows[0];
    }
    const [rows] = await pool.query('SELECT * FROM products WHERE code = ?', [id]);
    return rows[0] || null;
};

// Find product by Code
export const findByCode = async (code) => {
    const [rows] = await pool.query('SELECT * FROM products WHERE code = ?', [code]);
    return rows[0] || null;
};

// Insert a new product
export const insert = async (product) => {
    const {
        code,
        name,
        category,
        packaging_unit,
        is_wholesale = 0,
        unit_cost = 0,
        selling_price = 0,
        stock = 0,
        low_stock_threshold = 10,
        active = 1,
        image = '',
        description = ''
    } = product;

    const [result] = await pool.query(
        `INSERT INTO products 
        (code, name, category, packaging_unit, is_wholesale, unit_cost, selling_price, stock, low_stock_threshold, active, image, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [code, name, category, packaging_unit, is_wholesale ? 1 : 0, unit_cost, selling_price, stock, low_stock_threshold, active ? 1 : 0, image, description]
    );

    // Initial stock log if stock > 0
    if (stock > 0) {
        await logStockChange({
            product_id: result.insertId,
            action_type: 'STOCK_IN',
            quantity: stock,
            prev_stock: 0,
            new_stock: stock,
            remarks: 'Initial stock on creation',
            performed_by: 'Admin'
        });
    }

    return result.insertId;
};

// Update an existing product
export const update = async (id, product) => {
    const existing = await findById(id);
    if (!existing) return 0;
    const realId = existing.id;

    const {
        name,
        category,
        packaging_unit,
        is_wholesale = 0,
        unit_cost,
        selling_price,
        stock,
        low_stock_threshold = 10,
        active = 1,
        image,
        description
    } = product;

    const [result] = await pool.query(
        `UPDATE products SET 
        name = ?, category = ?, packaging_unit = ?, is_wholesale = ?,
        unit_cost = ?, selling_price = ?, stock = ?, low_stock_threshold = ?,
        active = ?, image = ?, description = ?
        WHERE id = ?`,
        [name, category, packaging_unit, is_wholesale ? 1 : 0, unit_cost, selling_price, stock, low_stock_threshold, active ? 1 : 0, image, description, realId]
    );

    return result.affectedRows;
};

// Delete product
export const remove = async (id) => {
    const existing = await findById(id);
    if (!existing) return 0;
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [existing.id]);
    return result.affectedRows;
};

// Log stock audit trail
export const logStockChange = async (logData) => {
    const { product_id, action_type, quantity, prev_stock, new_stock, remarks, performed_by = 'Admin' } = logData;
    const [result] = await pool.query(
        `INSERT INTO stock_logs 
        (product_id, action_type, quantity, prev_stock, new_stock, remarks, performed_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [product_id, action_type, quantity, prev_stock, new_stock, remarks, performed_by]
    );
    return result.insertId;
};

// Get stock logs for a specific product or all products
export const getStockLogs = async (productId = null, limit = 50) => {
    let sql = `
        SELECT sl.*, p.name AS product_name, p.code AS product_code, p.packaging_unit
        FROM stock_logs sl
        JOIN products p ON sl.product_id = p.id
    `;
    const params = [];

    if (productId) {
        sql += ' WHERE sl.product_id = ?';
        params.push(productId);
    }

    sql += ' ORDER BY sl.created_at DESC, sl.id DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const [rows] = await pool.query(sql, params);
    return rows;
};

// Receive stock / Stock-in
export const updateStockQty = async (id, delta, actionType, remarks, performedBy = 'Admin') => {
    const existing = await findById(id);
    if (!existing) throw new Error('Product not found');
    const realId = existing.id;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [rows] = await conn.query('SELECT stock, name FROM products WHERE id = ? FOR UPDATE', [realId]);
        if (!rows.length) {
            throw new Error('Product not found');
        }

        const prevStock = rows[0].stock;
        const newStock = prevStock + delta;

        if (newStock < 0) {
            throw new Error(`Insufficient stock. Current: ${prevStock}, Attempted reduction: ${Math.abs(delta)}`);
        }

        await conn.query('UPDATE products SET stock = ? WHERE id = ?', [newStock, realId]);

        await conn.query(
            `INSERT INTO stock_logs (product_id, action_type, quantity, prev_stock, new_stock, remarks, performed_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [realId, actionType, Math.abs(delta), prevStock, newStock, remarks, performedBy]
        );

        await conn.commit();
        return { prevStock, newStock };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// Bulk automatic stock deduction upon completed sale
export const deductOrderStock = async (items, orderCode = '', performedBy = 'System Sale') => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const deductions = [];

        for (const item of items) {
            const existing = await findById(item.productId);
            if (!existing) {
                throw new Error(`Product "${item.productId}" not found.`);
            }
            const realId = existing.id;

            const [rows] = await conn.query('SELECT id, name, stock FROM products WHERE id = ? FOR UPDATE', [realId]);
            if (!rows.length) {
                throw new Error(`Product ID ${realId} not found.`);
            }

            const current = rows[0];
            const prevStock = current.stock;
            const newStock = prevStock - item.qty;

            if (newStock < 0) {
                throw new Error(`Stock deduction failed for "${current.name}": Only ${prevStock} available, requested ${item.qty}.`);
            }

            await conn.query('UPDATE products SET stock = ? WHERE id = ?', [newStock, current.id]);

            await conn.query(
                `INSERT INTO stock_logs (product_id, action_type, quantity, prev_stock, new_stock, remarks, performed_by)
                 VALUES (?, 'SALE_DEDUCT', ?, ?, ?, ?, ?)`,
                [current.id, item.qty, prevStock, newStock, `Sold in Order ${orderCode}`, performedBy]
            );

            deductions.push({ productId: current.id, name: current.name, prevStock, newStock });
        }

        await conn.commit();
        return deductions;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
