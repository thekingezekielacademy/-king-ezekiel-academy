# 🚀 Webhook Server Setup Guide

## 📋 Prerequisites
- Node.js 16+ installed
- Paystack account with API keys
- Supabase project with service role key
- ngrok (for local testing)

## 🔧 Step 1: Install Dependencies
```bash
cd server
npm install
```

## 🔑 Step 2: Environment Variables
Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret_here
```

### **Where to Get These Keys:**

#### **Paystack Keys:**
1. Go to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Navigate to **Settings > API Keys**
3. Copy your **Secret Key** and **Public Key**
4. Use **Test Keys** for development

#### **Supabase Keys:**
1. Go to your [Supabase Project](https://supabase.com/dashboard)
2. Navigate to **Settings > API**
3. Copy your **Project URL** and **Service Role Key**

## 🌐 Step 3: Start the Server
```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

## 📡 Step 4: Configure Paystack Webhook
1. **For Production:**
   - Set webhook URL: `https://your-domain.com/api/webhooks/paystack`
   - Events to send: `charge.success`, `subscription.create`, `subscription.disable`

2. **For Local Testing:**
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Expose your local server
   ngrok http 5000
   
   # Use the ngrok URL in Paystack dashboard
   # Example: https://abc123.ngrok.io/api/webhooks/paystack
   ```

## 🧪 Step 5: Test the System

### **Test Payment Flow:**
1. Start the webhook server
2. Make a test payment in your app
3. Check server logs for webhook events
4. Verify database updates

### **Test Endpoints:**
- **Health Check:** `GET http://localhost:5000/api/health`
- **Webhook:** `POST http://localhost:5000/api/webhooks/paystack`
- **Payment Verify:** `POST http://localhost:5000/api/payments/verify`

## 🔍 Step 6: Monitor Logs
The server provides detailed logging:
- ✅ Successful operations
- ❌ Error messages
- 📨 Webhook events received
- 💰 Payment processing status

## 🚨 Troubleshooting

### **Common Issues:**
1. **Port already in use:** Change PORT in .env
2. **Webhook signature fails:** Check PAYSTACK_SECRET_KEY
3. **Database connection fails:** Verify Supabase credentials
4. **CORS errors:** Check frontend URL configuration

### **Debug Mode:**
Set `NODE_ENV=development` for detailed logging

## 📱 Frontend Integration

Update your frontend to use the new server:
```typescript
// In Profile.tsx, update the verification endpoint
const verifyPaymentOnServer = async (reference: string, userId: string) => {
  try {
    const response = await fetch('http://localhost:5000/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, userId })
    });
    
    const result = await response.json();
    console.log('Payment verification result:', result);
  } catch (error) {
    console.error('Payment verification failed:', error);
  }
};
```

## 🚀 Production Deployment

1. **Set environment variables** on your hosting platform
2. **Use HTTPS** for webhook endpoints
3. **Configure domain** in Paystack dashboard
4. **Monitor logs** for production issues
5. **Set up monitoring** for server health

## 📊 Webhook Events Handled

- `charge.success` - Payment completed
- `subscription.create` - New subscription
- `subscription.disable` - Subscription cancelled
- `subscription.enable` - Subscription reactivated
- `invoice.payment_failed` - Payment failed
- `invoice.payment_success` - Invoice paid

## 🔒 Security Features

- **HMAC Signature Verification** - Prevents webhook spoofing
- **CORS Protection** - Secure cross-origin requests
- **Environment Variables** - No hardcoded secrets
- **Error Handling** - Graceful failure handling
- **Input Validation** - Secure data processing
