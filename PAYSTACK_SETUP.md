# Paystack Payment Setup Guide

This guide will help you set up Paystack payments for the King Ezekiel Academy subscription system.

## 1. Paystack Account Setup

1. **Create Account**: Go to [Paystack Dashboard](https://dashboard.paystack.com/) and create an account
2. **Verify Account**: Complete your business verification
3. **Get API Keys**: Go to Settings > API Keys

## 2. Environment Variables

### Frontend (.env file in client directory)
```bash
# Paystack Configuration
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_your_test_key_here
REACT_APP_PAYSTACK_PLAN_CODE=PLN_your_plan_code_here
```

### Backend (.env file in server directory)
```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here
```

## 3. Create Subscription Plan

1. **Go to Plans**: In Paystack dashboard, navigate to Settings > Plans
2. **Create Plan**: 
   - Name: "King Ezekiel Academy Membership"
   - Amount: ₦2,500
   - Interval: Monthly
   - Plan Code: Copy the generated code (e.g., `PLN_abc123`)
3. **Update Plan Code**: Put this code in your `.env` file

## 4. Configure Webhooks

1. **Go to Webhooks**: In Paystack dashboard, navigate to Settings > Webhooks
2. **Add Webhook**:
   - URL: `https://yourdomain.com/api/payments/webhook`
   - Events to send: Select all events
3. **Copy Secret**: Copy the webhook secret to your backend `.env` file

## 5. Test the Integration

1. **Use Test Keys**: Make sure you're using test keys during development
2. **Test Payment**: Try making a test subscription payment
3. **Check Webhooks**: Verify webhook events are being received

## 6. Go Live

1. **Switch to Live Keys**: Replace test keys with live keys
2. **Update Webhook URL**: Change webhook URL to your production domain
3. **Test Live Payment**: Make a small live payment to verify everything works

## 7. Security Notes

- **Never expose secret keys** in frontend code
- **Always verify webhook signatures** on the backend
- **Use HTTPS** for all webhook endpoints
- **Implement proper error handling** for failed payments

## 8. Troubleshooting

### Common Issues:
- **"Payment library not loaded"**: Check if Paystack script is loading
- **"Invalid webhook signature"**: Verify webhook secret is correct
- **"Payment verification failed"**: Check if secret key is correct

### Debug Steps:
1. Check browser console for JavaScript errors
2. Verify environment variables are loaded
3. Check server logs for webhook errors
4. Verify Paystack dashboard for transaction status

## 9. Support

- **Paystack Support**: [support@paystack.com](mailto:support@paystack.com)
- **Documentation**: [Paystack Docs](https://paystack.com/docs)
- **API Reference**: [Paystack API](https://paystack.com/docs/api)

## 10. Production Checklist

- [ ] Live API keys configured
- [ ] Webhook URL updated to production domain
- [ ] HTTPS enabled on webhook endpoint
- [ ] Error handling implemented
- [ ] Payment verification working
- [ ] Subscription management tested
- [ ] Cancellation flow tested
