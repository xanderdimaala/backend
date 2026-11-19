-- ==============================================================
-- ALL MIGHTY BUSINESS OPERATIONS AND MANAGEMENT SYSTEM
-- Module 2: Product & Inventory Management
-- Database: allmighty (or import into your local MySQL/XAMPP)
-- ==============================================================

CREATE DATABASE IF NOT EXISTS allmighty;
USE allmighty;

-- --------------------------------------------------------------
-- 1. Products Table (Catalog & Masterfile)
-- Supports retail packs, bottles, gallons, and wholesale kahon-kahon boxes
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,          -- e.g., 'Laundry', 'Dishwashing', 'Surface Cleaners', 'Bleach'
    packaging_unit VARCHAR(100) NOT NULL,    -- e.g., 'Pouch (500ml)', 'Bottle (1L)', 'Gallon (4L)', 'Kahon (24 pcs)', 'Kahon (48 pcs)'
    is_wholesale BOOLEAN NOT NULL DEFAULT 0, -- 0 = Retail / Tingi, 1 = Wholesale / Kahon-kahon
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 10,
    active BOOLEAN NOT NULL DEFAULT 1,       -- 1 = Available/Active, 0 = Inactive/Hidden
    image LONGTEXT NULL,                     -- Base64 or image URL
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- 2. Stock Logs Table (Real-time Inventory Audit Trail)
-- Records stock-in, manual adjustments, and sales deductions
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    action_type ENUM('STOCK_IN', 'ADJUSTMENT_ADD', 'ADJUSTMENT_SUB', 'SALE_DEDUCT', 'RESTOCK_RESET') NOT NULL,
    quantity INT NOT NULL,                   -- Quantity changed
    prev_stock INT NOT NULL,                 -- Stock before change
    new_stock INT NOT NULL,                  -- Stock after change
    remarks VARCHAR(255) NULL,               -- e.g., 'Supplier Restock', 'Damaged goods', 'Physical count correction'
    performed_by VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------
-- 3. Seed Initial Soap and Detergent Products
-- Realistic data for All Mighty Soap & Detergent Business
-- --------------------------------------------------------------
INSERT INTO products (code, name, category, packaging_unit, is_wholesale, unit_cost, selling_price, stock, low_stock_threshold, active, image, description)
VALUES
('PRD-AP-01', 'All-Purpose Surface Cleaner (1L)', 'Surface Cleaners', 'Bottle (1L)', 0, 55.00, 89.00, 18, 10, 1, '../images/products/all-purpose-cleaner.jpg', 'Antibacterial multi-surface cleaner for tiles, countertops, and glass.'),
('PRD-AP-K24', 'All-Purpose Surface Cleaner - Wholesale Kahon (24 pcs)', 'Surface Cleaners', 'Kahon (24 pcs)', 1, 1100.00, 1850.00, 8, 5, 1, '../images/products/all-purpose-cleaner.jpg', 'Wholesale box of 24 bottles (1L each) for resellers and commercial cleaning.'),
('PRD-LD-02', 'Fresh Lavender Liquid Laundry Detergent (2L)', 'Laundry', 'Bottle (2L)', 0, 95.00, 149.00, 6, 10, 1, '../images/products/fresh-laundry-wash.jpg', 'Tough on stains, gentle on fabrics with long-lasting floral freshness.'),
('PRD-LD-GAL', 'Fresh Lavender Liquid Laundry Detergent - Gallon (4L)', 'Laundry', 'Gallon (4L)', 0, 175.00, 275.00, 12, 8, 1, '../images/products/fresh-laundry-wash.jpg', 'Economical 4-liter gallon for households and laundry shops.'),
('PRD-LD-K12', 'Fresh Lavender Detergent - Wholesale Kahon (12 Gallons)', 'Laundry', 'Kahon (12 pcs)', 1, 1950.00, 3100.00, 5, 3, 1, '../images/products/fresh-laundry-wash.jpg', 'Wholesale bulk box of 12 gallons for laundry businesses and retailers.'),
('PRD-DW-03', 'Kalamansi Antibacterial Dishwashing Liquid (1L)', 'Kitchen', 'Bottle (1L)', 0, 48.00, 79.00, 14, 10, 1, '../images/products/dishwashing-liquid.jpg', 'Cuts through grease instantly with natural kalamansi extract and germ protection.'),
('PRD-DW-K24', 'Kalamansi Dishwashing Liquid - Wholesale Kahon (24 pcs)', 'Kitchen', 'Kahon (24 pcs)', 1, 980.00, 1650.00, 10, 5, 1, '../images/products/dishwashing-liquid.jpg', 'Wholesale master box of 24 bottles (1L each).'),
('PRD-FS-04', 'Fabric Softener Morning Dew (1L)', 'Laundry', 'Bottle (1L)', 0, 72.00, 115.00, 12, 10, 1, '../images/products/fabric-softener.jpg', 'Leaves clothes soft, wrinkle-resistant, and fragranced for days.'),
('PRD-FS-K24', 'Fabric Softener Morning Dew - Wholesale Kahon (24 pcs)', 'Laundry', 'Kahon (24 pcs)', 1, 1500.00, 2450.00, 4, 5, 1, '../images/products/fabric-softener.jpg', 'Bulk wholesale box of 24 bottles (1L).'),
('PRD-BL-05', 'All Mighty Heavy Duty Bleach (1L)', 'Bleach & Disinfectant', 'Bottle (1L)', 0, 38.00, 65.00, 25, 10, 1, '../images/products/all-purpose-cleaner.jpg', 'Powerful whitening and sanitizing formula for white clothes and deep cleaning.'),
('PRD-PD-06', 'High Foam Powder Detergent with Fabcon (1kg)', 'Laundry', 'Pack (1kg)', 0, 42.00, 68.00, 0, 15, 1, '../images/products/fresh-laundry-wash.jpg', 'High suds powder detergent with micro-perfume pearls. (Currently Out of Stock sample)')
ON DUPLICATE KEY UPDATE code=code;
