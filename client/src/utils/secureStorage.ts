// Secure Storage Utility
// Provides encrypted storage for sensitive data with automatic cleanup

interface SecureStorageData {
  subscription_active?: string;
  subscription_ref?: string;
  subscription_amount?: string;
  subscription_currency?: string;
  subscription_next_renewal?: string;
  recent_course_id?: string;
  recent_course_progress?: string;
  recent_course_timestamp?: string;
  recent_course_completed?: string;
}

class SecureStorage {
  private static instance: SecureStorage;
  private encryptionKey: string;
  private sessionTimeout: number = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    // Generate a simple encryption key (in production, use proper key management)
    this.encryptionKey = this.generateKey();
  }

  public static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  private generateKey(): string {
    // Simple key generation - in production, use proper cryptographic key generation
    return btoa(Date.now().toString() + Math.random().toString());
  }

  private encrypt(data: string): string {
    try {
      // Simple XOR encryption (in production, use proper encryption)
      let encrypted = '';
      for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
      }
      return btoa(encrypted);
    } catch (error) {
      console.error('Encryption error:', error);
      return data; // Fallback to plain text if encryption fails
    }
  }

  private decrypt(encryptedData: string): string {
    try {
      // Simple XOR decryption
      const decoded = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedData; // Fallback to original data if decryption fails
    }
  }

  public setItem(key: keyof SecureStorageData, value: string): void {
    try {
      const encryptedValue = this.encrypt(value);
      const data = {
        value: encryptedValue,
        timestamp: Date.now(),
        expires: Date.now() + this.sessionTimeout
      };
      sessionStorage.setItem(`secure_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting secure storage item:', error);
      // Fallback to sessionStorage without encryption
      sessionStorage.setItem(key, value);
    }
  }

  public getItem(key: keyof SecureStorageData): string | null {
    try {
      const encryptedData = sessionStorage.getItem(`secure_${key}`);
      if (!encryptedData) {
        // Fallback to regular sessionStorage
        return sessionStorage.getItem(key);
      }

      const data = JSON.parse(encryptedData);
      
      // Check if data has expired
      if (data.expires && Date.now() > data.expires) {
        this.removeItem(key);
        return null;
      }

      return this.decrypt(data.value);
    } catch (error) {
      console.error('Error getting secure storage item:', error);
      // Fallback to regular sessionStorage
      return sessionStorage.getItem(key);
    }
  }

  public removeItem(key: keyof SecureStorageData): void {
    try {
      sessionStorage.removeItem(`secure_${key}`);
      sessionStorage.removeItem(key); // Remove fallback item too
    } catch (error) {
      console.error('Error removing secure storage item:', error);
    }
  }

  public clear(): void {
    try {
      // Clear all secure storage items
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('secure_')) {
          sessionStorage.removeItem(key);
        }
      });
      // Also clear fallback items
      this.clearFallbackItems();
    } catch (error) {
      console.error('Error clearing secure storage:', error);
    }
  }

  private clearFallbackItems(): void {
    const fallbackKeys: (keyof SecureStorageData)[] = [
      'subscription_active',
      'subscription_ref',
      'subscription_amount',
      'subscription_currency',
      'subscription_next_renewal',
      'recent_course_id',
      'recent_course_progress',
      'recent_course_timestamp',
      'recent_course_completed'
    ];

    fallbackKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing fallback item ${key}:`, error);
      }
    });
  }

  public isSubscriptionActive(): boolean {
    const active = this.getItem('subscription_active');
    return active === 'true';
  }

  public setSubscriptionActive(active: boolean): void {
    this.setItem('subscription_active', active.toString());
  }

  public getSubscriptionData(): Partial<SecureStorageData> {
    return {
      subscription_active: this.getItem('subscription_active'),
      subscription_ref: this.getItem('subscription_ref'),
      subscription_amount: this.getItem('subscription_amount'),
      subscription_currency: this.getItem('subscription_currency'),
      subscription_next_renewal: this.getItem('subscription_next_renewal')
    };
  }

  public setSubscriptionData(data: Partial<SecureStorageData>): void {
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        this.setItem(key as keyof SecureStorageData, value.toString());
      }
    });
  }

  public cleanup(): void {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('secure_')) {
          const data = sessionStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.expires && Date.now() > parsed.expires) {
                sessionStorage.removeItem(key);
              }
            } catch (error) {
              // If parsing fails, remove the item
              sessionStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const secureStorage = SecureStorage.getInstance();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    secureStorage.cleanup();
  });
}

export default secureStorage;
