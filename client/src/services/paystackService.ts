// Paystack Service - Secure Subscription Management
import { supabase } from '../lib/supabase';

export interface PaystackSubscription {
  id: string;
  user_id: string;
  paystack_subscription_id: string;
  plan_name: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  amount: number;
  currency: string;
  start_date: string;
  end_date?: string;
  next_payment_date?: string;
}

export interface PaystackPayment {
  id: string;
  user_id: string;
  paystack_transaction_id: string;
  paystack_reference: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending' | 'abandoned';
  payment_method?: string;
  paid_at?: string;
}

class PaystackService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_PAYSTACK_SECRET_KEY || '';
    this.baseUrl = 'https://api.paystack.co';
  }

  // Initialize Paystack payment
  async initializePayment(email: string, amount: number, reference: string, callbackUrl: string) {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amount * 100, // Convert to kobo
          reference,
          callback_url: callbackUrl,
          currency: 'NGN',
        }),
      });

      const data = await response.json();
      
      if (!data.status) {
        throw new Error(data.message || 'Failed to initialize payment');
      }

      return data.data;
    } catch (error) {
      console.error('Paystack initialization error:', error);
      throw error;
    }
  }

  // Verify payment
  async verifyPayment(reference: string) {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json();
      
      if (!data.status) {
        throw new Error(data.message || 'Failed to verify payment');
      }

      return data.data;
    } catch (error) {
      console.error('Paystack verification error:', error);
      throw error;
    }
  }

  // Create subscription
  async createSubscription(customerCode: string, planCode: string) {
    try {
      const response = await fetch(`${this.baseUrl}/subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: customerCode,
          plan: planCode,
          start_date: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      
      if (!data.status) {
        throw new Error(data.message || 'Failed to create subscription');
      }

      return data.data;
    } catch (error) {
      console.error('Paystack subscription creation error:', error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/subscription/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json();
      
      if (!data.status) {
        throw new Error(data.message || 'Failed to get subscription');
      }

      return data.data;
    } catch (error) {
      console.error('Paystack subscription fetch error:', error);
      throw error;
    }
  }

  // Get customer subscriptions
  async getCustomerSubscriptions(customerCode: string) {
    try {
      const response = await fetch(`${this.baseUrl}/subscription?customer=${customerCode}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json();
      
      if (!data.status) {
        throw new Error(data.message || 'Failed to get customer subscriptions');
      }

      return data.data;
    } catch (error) {
      console.error('Paystack customer subscriptions fetch error:', error);
      throw error;
    }
  }

  // Database Operations

  // Save subscription to database
  async saveSubscription(userId: string, paystackData: any): Promise<PaystackSubscription> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          paystack_subscription_id: paystackData.subscription_code,
          paystack_customer_code: paystackData.customer.customer_code,
          plan_name: paystackData.plan.name,
          status: paystackData.status,
          amount: paystackData.plan.amount,
          currency: paystackData.plan.currency,
          start_date: paystackData.start,
          end_date: paystackData.next_payment_date,
          next_payment_date: paystackData.next_payment_date,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving subscription to database:', error);
      throw error;
    }
  }

  // Save payment to database
  async savePayment(userId: string, subscriptionId: string, paystackData: any): Promise<PaystackPayment> {
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .insert({
          user_id: userId,
          subscription_id: subscriptionId,
          paystack_transaction_id: paystackData.id,
          paystack_reference: paystackData.reference,
          amount: paystackData.amount,
          currency: paystackData.currency,
          status: paystackData.status,
          payment_method: paystackData.channel,
          paid_at: paystackData.paid_at,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving payment to database:', error);
      throw error;
    }
  }

  // Get user subscription from database
  async getUserSubscription(userId: string): Promise<PaystackSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  // Get user payment history from database
  async getUserPaymentHistory(userId: string): Promise<PaystackPayment[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }

  // Update subscription status
  async updateSubscriptionStatus(subscriptionId: string, status: string) {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('paystack_subscription_id', subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating subscription status:', error);
      throw error;
    }
  }

  // Check if user has active subscription
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      return subscription?.status === 'active';
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }
}

export const paystackService = new PaystackService();
export default paystackService;
