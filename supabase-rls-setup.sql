-- ============================================
-- Row Level Security (RLS) Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Drop existing policies (if any)
-- ============================================

DROP POLICY IF EXISTS "Allow all for service role" ON products;
DROP POLICY IF EXISTS "Allow all for service role" ON customers;
DROP POLICY IF EXISTS "Allow all for service role" ON email_accounts;
DROP POLICY IF EXISTS "Allow all for service role" ON processed_emails;
DROP POLICY IF EXISTS "Allow all for service role" ON rfq_requests;

-- ============================================
-- PRODUCTS Table Policies
-- ============================================

-- Allow service role full access (used by API)
CREATE POLICY "Allow all for service role"
ON products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- CUSTOMERS Table Policies
-- ============================================

CREATE POLICY "Allow all for service role"
ON customers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- EMAIL_ACCOUNTS Table Policies
-- ============================================

CREATE POLICY "Allow all for service role"
ON email_accounts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- PROCESSED_EMAILS Table Policies
-- ============================================

CREATE POLICY "Allow all for service role"
ON processed_emails
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- RFQ_REQUESTS Table Policies
-- ============================================

CREATE POLICY "Allow all for service role"
ON rfq_requests
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- Verify RLS is enabled
-- ============================================

SELECT 
    schemaname,
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'customers', 'email_accounts', 'processed_emails', 'rfq_requests')
ORDER BY tablename;

-- ============================================
-- Expected Output:
-- All tables should show rowsecurity = true
-- ============================================
