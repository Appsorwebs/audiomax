import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { freeApiKeyService } from '../services/freeApiService';

interface ApiUsageDisplayProps {
  user: User;
  onUpgrade?: () => void;
}

const ApiUsageDisplay: React.FC<ApiUsageDisplayProps> = ({ user, onUpgrade }) => {
  const [usageLimits, setUsageLimits] = useState<{
    dailyMinutesRemaining: number;
    monthlyMinutesRemaining: number;
    monthlyMeetingsRemaining: number;
    nextResetTime: number;
    upgradeAvailable: boolean;
  } | null>(null);

  useEffect(() => {
    if (user.subscription === 'Free' && !user.isGuest) {
      const limits = freeApiKeyService.getUserLimits(user.email);
      setUsageLimits(limits);
    }
  }, [user]);

  if (!usageLimits || user.subscription !== 'Free' || user.isGuest) {
    return null;
  }

  const hoursUntilReset = Math.ceil((usageLimits.nextResetTime - Date.now()) / (1000 * 60 * 60));

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            🎁 Free API Access
          </h3>
          
          <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <div className="flex justify-between">
              <span>Minutes Transcribed:</span>
              <span className="font-medium">{60 - usageLimits.monthlyMinutesRemaining} min / 60 min</span>
            </div>
            
            <div className="flex justify-between">
              <span>Meetings This Month:</span>
              <span className="font-medium">{5 - usageLimits.monthlyMeetingsRemaining} / 5</span>
            </div>
            
            <div className="flex justify-between">
              <span>Daily reset in:</span>
              <span className="font-medium">{hoursUntilReset} hours</span>
            </div>
            
            <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-800/30 rounded text-xs">
              <div className="flex items-center space-x-1 mb-1">
                <span>📝</span>
                <span>Free tier includes:</span>
              </div>
              <ul className="ml-4 space-y-1">
                <li>• 60 minutes per month</li>
                <li>• 5 meetings per month</li>
                <li>• Up to 5 minutes per audio</li>
                <li>• 2-minute rate limit between requests</li>
              </ul>
            </div>
          </div>
        </div>
        
        {usageLimits.upgradeAvailable && onUpgrade && (
          <button
            onClick={onUpgrade}
            className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
          >
            Upgrade
          </button>
        )}
      </div>
      
      {(usageLimits.monthlyMinutesRemaining === 0 || usageLimits.monthlyMeetingsRemaining === 0) && (
        <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded text-sm text-orange-800 dark:text-orange-200">
          <div className="flex items-center space-x-1">
            <span>⚠️</span>
            <span>
              {usageLimits.monthlyMinutesRemaining === 0 
                ? 'Monthly minutes limit reached. Resets next month.'
                : 'Monthly meetings limit reached. Resets next month.'}
            </span>
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="mt-2 text-orange-700 dark:text-orange-300 underline hover:no-underline text-xs"
            >
              Upgrade for unlimited access →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiUsageDisplay;