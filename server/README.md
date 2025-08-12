# King Ezekiel Academy - Webhook Server

This server handles Paystack webhooks and payment verification for the King Ezekiel Academy platform.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Environment Variables
Create a `.env` file in the server directory with:

```env
# Server Configuration
PORT=5000

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Environment
NODE_ENV=development
```

### 3. Run the Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 📡 Webhook Endpoints

### Paystack Webhook
- **URL**: `POST /api/webhooks/paystack`
- **Purpose**: Receives Paystack webhook events
- **Security**: Verifies webhook signature using HMAC SHA512

### Payment Verification
- **URL**: `POST /api/payments/verify`
- **Purpose**: Verifies payment status with Paystack
- **Body**: `{ reference: "payment_ref", userId: "user_id" }`

### Health Check
- **URL**: `GET /api/health`
- **Purpose**: Server status and uptime

## 🔐 Security Features

- **Webhook Signature Verification**: Uses Paystack's HMAC SHA512 signature
- **CORS Protection**: Configured for secure cross-origin requests
- **Environment Variables**: Sensitive data stored in .env file

## 📊 Supported Webhook Events

- `charge.success` - Successful payment
- `subscription.create` - New subscription created
- `subscription.disable` - Subscription disabled
- `subscription.enable` - Subscription enabled
- `invoice.payment_failed` - Payment failed
- `invoice.payment_success` - Invoice payment successful

## 🗄️ Database Integration

The server automatically updates the Supabase database with:
- User subscription status
- Payment history
- Subscription lifecycle events

## 🚨 Error Handling

- Comprehensive error logging
- Graceful fallbacks for database operations
- User-friendly error messages

## 🔧 Development

### Prerequisites
- Node.js 16+
- npm or yarn
- Supabase project
- Paystack account

### Testing Webhooks
Use tools like ngrok to test webhooks locally:
```bash
ngrok http 5000
```

Then set the webhook URL in Paystack dashboard to:
`https://your-ngrok-url.ngrok.io/api/webhooks/paystack`

## 📝 Notes

- Ensure Supabase service role key has write permissions
- Test webhooks in Paystack test mode first
- Monitor server logs for webhook processing status
- Keep Paystack secret key secure and never commit to version control
