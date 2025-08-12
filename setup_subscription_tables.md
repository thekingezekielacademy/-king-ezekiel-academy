# 🗄️ Setup Subscription Database Tables

## 📋 **Steps to Create Database Tables**

### **1. Open Supabase Dashboard**
- Go to [supabase.com](https://supabase.com)
- Sign in to your project
- Navigate to **SQL Editor**

### **2. Run Migration 1: Create Subscription Tables**
Copy and paste this SQL into the SQL Editor:

```sql
-- Create subscription and payment tables
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  paystack_subscription_id TEXT,
  paystack_customer_code TEXT,
  plan_name TEXT NOT NULL DEFAULT 'Monthly Membership',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  next_payment_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  paystack_transaction_id TEXT,
  paystack_reference TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  payment_method TEXT DEFAULT 'card',
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payments" ON subscription_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON subscription_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON subscription_payments TO authenticated;
```

### **3. Run Migration 2: Add Profile Columns**
Copy and paste this SQL:

```sql
-- Add subscription columns to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
    ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'subscription_plan') THEN
    ALTER TABLE profiles ADD COLUMN subscription_plan TEXT DEFAULT 'none';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at') THEN
    ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Update existing profiles
UPDATE profiles 
SET subscription_status = 'inactive' 
WHERE subscription_status IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
```

### **4. Verify Tables Created**
Run this query to check:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_subscriptions', 'subscription_payments');

-- Check profiles columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'subscription%';
```

## 🎯 **Expected Result**
After running these migrations:
- ✅ `user_subscriptions` table created
- ✅ `subscription_payments` table created  
- ✅ RLS policies enabled
- ✅ Profile columns added
- ✅ No more 404 errors in Profile page

## 🚀 **After Migration**
1. **Restart your app** if needed
2. **Go to Profile page** - should now fetch from database
3. **Check console** - should see successful database queries
4. **Subscription status** should display correctly

Run these migrations and let me know if you still see any 404 errors!
