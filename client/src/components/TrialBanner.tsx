import React from 'react';
import { FaClock, FaExclamationTriangle, FaCrown } from 'react-icons/fa';
import { TrialManager, TrialStatus } from '../utils/trialManager';

interface TrialBannerProps {
  user: any;
  onSubscribe: () => void;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ user, onSubscribe }) => {
  const trialStatus = TrialManager.checkTrialStatus(user);
  const progress = TrialManager.getTrialProgress(user);
  const warning = TrialManager.getExpirationWarning(user);

  if (!trialStatus.isActive && !warning) {
    return null; // Don't show banner if no trial and no warning
  }

  return (
    <div className="w-full">
      {/* Trial Status Banner */}
      {trialStatus.isActive && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FaClock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  🎉 7-Day Free Trial Active
                </h3>
                <p className="text-sm text-blue-700">
                  {trialStatus.message}
                </p>
              </div>
            </div>
            <button
              onClick={onSubscribe}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Subscribe Now
            </button>
          </div>
          
          {/* Trial Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-blue-600 mb-1">
              <span>Trial Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-blue-600 mt-1">
              <span>Started: {new Date(trialStatus.trialStartDate).toLocaleDateString()}</span>
              <span>Expires: {new Date(trialStatus.trialEndDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Trial Expiration Warning */}
      {warning && (
        <div className="bg-gradient-to-r from-orange-50 to-red-100 border border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-900">
                  ⚠️ Trial Expiring Soon
                </h3>
                <p className="text-sm text-orange-700">
                  {warning}
                </p>
              </div>
            </div>
            <button
              onClick={onSubscribe}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              Subscribe Now
            </button>
          </div>
        </div>
      )}

      {/* Trial Expired Message */}
      {!trialStatus.canAccessCourses && !trialStatus.isActive && (
        <div className="bg-gradient-to-r from-red-50 to-pink-100 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FaCrown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">
                  🔒 Trial Expired
                </h3>
                <p className="text-sm text-red-700">
                  Your 7-day free trial has ended. Subscribe to continue learning!
                </p>
              </div>
            </div>
            <button
              onClick={onSubscribe}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Subscribe Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialBanner;
