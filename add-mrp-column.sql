-- Add MRP column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS mrp DECIMAL(10, 2);

-- Add comment explaining the field
COMMENT ON COLUMN products.mrp IS 'Maximum Retail Price (inclusive of 18% GST)';

-- Update existing products to calculate MRP from base_price if needed
-- MRP = base_price * 1.18
UPDATE products
SET mrp = base_price * 1.18
WHERE mrp IS NULL AND base_price IS NOT NULL;
