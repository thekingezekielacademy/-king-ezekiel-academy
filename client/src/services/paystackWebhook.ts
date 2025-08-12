// Paystack Webhook Handler
// This handles Paystack webhook events to keep our database in sync

import { supabase } from '../lib/supabase';

export interface PaystackWebhookEvent {
  event: string;
  data: any;
}

export class PaystackWebhookHandler {
  // Handle webhook events from Paystack
  static async handleWebhook(event: PaystackWebhookEvent) {
    try {
      console.log('Processing Paystack webhook:', event.event);

      switch (event.event) {
        case 'charge.success':
          await this.handlePaymentSuccess(event.data);
          break;
        
        case 'subscription.create':
          await this.handleSubscriptionCreated(event.data);
          break;
        
        case 'subscription.disable':
          await this.handleSubscriptionDisabled(event.data);
          break;
        
        case 'subscription.enable':
          await this.handleSubscriptionEnabled(event.data);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data);
          break;
        
        case 'invoice.payment_success':
          await this.handlePaymentSuccess(event.data);
          break;
        
        default:
          console.log('Unhandled webhook event:', event.event);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  // Handle successful payment
  private static async handlePaymentSuccess(data: any) {
    try {
      const { transaction, customer } = data;
      
      // Find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customer.email)
        .single();

      if (userError || !userData) {
        console.error('User not found for payment:', customer.email);
        return;
      }

      // Save payment record
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          user_id: userData.id,
          paystack_transaction_id: transaction.id.toString(),
          paystack_reference: transaction.reference,
          amount: transaction.amount,
          currency: transaction.currency,
          status: 'success',
          payment_method: transaction.channel,
          paid_at: transaction.paid_at,
        });

      if (paymentError) {
        console.error('Error saving payment:', paymentError);
      } else {
        console.log('Payment saved successfully for user:', userData.id);
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  // Handle subscription creation
  private static async handleSubscriptionCreated(data: any) {
    try {
      const { subscription, customer } = data;
      
      // Find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customer.email)
        .single();

      if (userError || !userData) {
        console.error('User not found for subscription:', customer.email);
        return;
      }

      // Save subscription record
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userData.id,
          paystack_subscription_id: subscription.subscription_code,
          paystack_customer_code: customer.customer_code,
          plan_name: subscription.plan.name,
          status: subscription.status,
          amount: subscription.plan.amount,
          currency: subscription.plan.currency,
          start_date: subscription.start,
          end_date: subscription.next_payment_date,
          next_payment_date: subscription.next_payment_date,
        });

      if (subscriptionError) {
        console.error('Error saving subscription:', subscriptionError);
      } else {
        console.log('Subscription saved successfully for user:', userData.id);
      }
    } catch (error) {
      console.error('Error handling subscription creation:', error);
    }
  }

  // Handle subscription disabled
  private static async handleSubscriptionDisabled(data: any) {
    try {
      const { subscription } = data;
      
      // Update subscription status in database
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('paystack_subscription_id', subscription.subscription_code);

      if (error) {
        console.error('Error updating subscription status:', error);
      } else {
        console.log('Subscription disabled successfully:', subscription.subscription_code);
      }
    } catch (error) {
      console.error('Error handling subscription disabled:', error);
    }
  }

  // Handle subscription enabled
  private static async handleSubscriptionEnabled(data: any) {
    try {
      const { subscription } = data;
      
      // Update subscription status in database
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('paystack_subscription_id', subscription.subscription_code);

      if (error) {
        console.error('Error updating subscription status:', error);
      } else {
        console.log('Subscription enabled successfully:', subscription.subscription_code);
      }
    } catch (error) {
      console.error('Error handling subscription enabled:', error);
    }
  }

  // Handle payment failure
  private static async handlePaymentFailed(data: any) {
    try {
      const { transaction, customer } = data;
      
      // Find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', customer.email)
        .single();

      if (userError || !userData) {
        console.error('User not found for failed payment:', customer.email);
        return;
      }

      // Save failed payment record
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          user_id: userData.id,
          paystack_transaction_id: transaction.id.toString(),
          paystack_reference: transaction.reference,
          amount: transaction.amount,
          currency: transaction.currency,
          status: 'failed',
          payment_method: transaction.channel,
        });

      if (paymentError) {
        console.error('Error saving failed payment:', paymentError);
      } else {
        console.log('Failed payment saved for user:', userData.id);
      }
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }
}

export default PaystackWebhookHandler;
