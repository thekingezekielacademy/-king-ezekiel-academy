// Trial Management System for 7-Day Free Trial
export interface TrialStatus {
  isActive: boolean;
  daysLeft: number;
  trialStartDate: string;
  trialEndDate: string;
  canAccessCourses: boolean;
  message: string;
}

export class TrialManager {
  // Check if user has active trial
  static checkTrialStatus(user: any): TrialStatus {
    if (!user) {
      return {
        isActive: false,
        daysLeft: 0,
        trialStartDate: '',
        trialEndDate: '',
        canAccessCourses: false,
        message: 'Please sign in to access your trial'
      };
    }

    // Check if user has subscription (overrides trial)
    const hasSubscription = localStorage.getItem('subscription_active') === 'true';
    if (hasSubscription) {
      return {
        isActive: false,
        daysLeft: 0,
        trialStartDate: '',
        trialEndDate: '',
        canAccessCourses: true,
        message: 'You have an active subscription'
      };
    }

    // Check trial dates
    const trialStart = user.trial_start_date || user.created_at;
    const trialEnd = user.trial_end_date || this.calculateTrialEnd(user.created_at);
    
    if (!trialStart || !trialEnd) {
      return {
        isActive: false,
        daysLeft: 0,
        trialStartDate: '',
        trialEndDate: '',
        canAccessCourses: false,
        message: 'Trial not available'
      };
    }

    const now = new Date();
    const endDate = new Date(trialEnd);
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      return {
        isActive: false,
        daysLeft: 0,
        trialStartDate: trialStart,
        trialEndDate: trialEnd,
        canAccessCourses: false,
        message: 'Your 7-day trial has expired. Subscribe to continue learning!'
      };
    }

    return {
      isActive: true,
      daysLeft: Math.max(0, daysLeft),
      trialStartDate: trialStart,
      trialEndDate: trialEnd,
      canAccessCourses: true,
      message: `You have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in your free trial`
    };
  }

  // Calculate trial end date (7 days from start)
  static calculateTrialEnd(startDate: string): string {
    const start = new Date(startDate);
    const end = new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000));
    return end.toISOString();
  }

  // Check if user can access a specific course
  static canAccessCourse(user: any, courseId?: string): boolean {
    const trialStatus = this.checkTrialStatus(user);
    return trialStatus.canAccessCourses;
  }

  // Get trial progress percentage
  static getTrialProgress(user: any): number {
    if (!user) return 0;

    const trialStart = new Date(user.trial_start_date || user.created_at);
    const trialEnd = new Date(user.trial_end_date || this.calculateTrialEnd(user.created_at));
    const now = new Date();

    const totalDuration = trialEnd.getTime() - trialStart.getTime();
    const elapsed = now.getTime() - trialStart.getTime();

    if (totalDuration <= 0) return 100;
    
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    return Math.round(progress);
  }

  // Format trial message for UI
  static formatTrialMessage(user: any): string {
    const trialStatus = this.checkTrialStatus(user);
    
    if (trialStatus.canAccessCourses && trialStatus.isActive) {
      return `🎉 ${trialStatus.message}`;
    } else if (trialStatus.canAccessCourses && !trialStatus.isActive) {
      return `✅ ${trialStatus.message}`;
    } else {
      return `🔒 ${trialStatus.message}`;
    }
  }

  // Check if trial is about to expire (within 24 hours)
  static isTrialExpiringSoon(user: any): boolean {
    const trialStatus = this.checkTrialStatus(user);
    return trialStatus.isActive && trialStatus.daysLeft <= 1;
  }

  // Get trial expiration warning
  static getExpirationWarning(user: any): string | null {
    if (!this.isTrialExpiringSoon(user)) return null;
    
    const trialStatus = this.checkTrialStatus(user);
    if (trialStatus.daysLeft === 0) {
      return '⚠️ Your trial expires today! Subscribe now to keep learning.';
    } else if (trialStatus.daysLeft === 1) {
      return '⚠️ Your trial expires tomorrow! Subscribe now to keep learning.';
    }
    
    return null;
  }
}

export default TrialManager;
