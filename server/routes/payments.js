const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;

// Verify Paystack webhook signature
const verifyWebhookSignature = (req, res, next) => {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  
  next();
};

// Verify payment with Paystack
router.post('/verify', async (req, res) => {
  try {
    const { reference } = req.body;
    
    if (!reference) {
      return res.status(400).json({ error: 'Payment reference is required' });
    }
    
    // Call Paystack API to verify payment
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (!result.status) {
      return res.status(400).json({ error: 'Failed to verify payment' });
    }
    
    if (result.data.status === 'success') {
      // Payment is successful
      const paymentData = {
        reference: result.data.reference,
        amount: result.data.amount / 100, // Convert from kobo to naira
        currency: result.data.currency,
        customerEmail: result.data.customer.email,
        status: result.data.status,
        paidAt: result.data.paid_at,
        metadata: result.data.metadata
      };
      
      // TODO: Update user subscription in database
      // await updateUserSubscription(paymentData);
      
      res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        data: paymentData
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Payment not successful',
        data: result.data
      });
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Paystack webhook endpoint
router.post('/webhook', verifyWebhookSignature, async (req, res) => {
  try {
    const event = req.body;
    
    // Handle different webhook events
    switch (event.event) {
      case 'charge.success':
        // Payment was successful
        const payment = event.data;
        console.log('Payment successful:', payment.reference);
        
        // TODO: Update user subscription in database
        // await processSuccessfulPayment(payment);
        break;
        
      case 'subscription.create':
        // New subscription created
        const subscription = event.data;
        console.log('Subscription created:', subscription.subscription_code);
        break;
        
      case 'subscription.disable':
        // Subscription disabled/cancelled
        const cancelledSub = event.data;
        console.log('Subscription cancelled:', cancelledSub.subscription_code);
        
        // TODO: Update user subscription status in database
        // await cancelUserSubscription(cancelledSub);
        break;
        
      default:
        console.log('Unhandled webhook event:', event.event);
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
