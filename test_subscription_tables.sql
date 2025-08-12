-- Test script to verify subscription tables are working
-- Run this in Supabase SQL Editor after creating the tables

-- 1. Check if tables exist
SELECT 
  'Tables Status' as check_type,
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_subscriptions', 'subscription_payments');

-- 2. Check table structure
SELECT 
  'user_subscriptions structure' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions'
ORDER BY ordinal_position;

SELECT 
  'subscription_payments structure' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'subscription_payments'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('user_subscriptions', 'subscription_payments');

-- 4. Check permissions
SELECT 
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('user_subscriptions', 'subscription_payments')
AND grantee = 'authenticated';

-- 5. Test insert (this should work for authenticated users)
-- Note: This will only work if you're authenticated in Supabase
-- INSERT INTO user_subscriptions (user_id, plan_name, amount, currency) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Test Plan', 250000, 'NGN');

-- 6. Check if any existing data
SELECT 
  'user_subscriptions' as table_name,
  COUNT(*) as record_count
FROM user_subscriptions
UNION ALL
SELECT 
  'subscription_payments' as table_name,
  COUNT(*) as record_count
FROM subscription_payments;
