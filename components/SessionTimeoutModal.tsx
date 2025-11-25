import React, { useState, useEffect } from 'react';
import { ClockIcon } from './icons';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onLogout: () => void;
  timeoutSeconds: number;
}

const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({ isOpen, onContinue, onLogout, timeoutSeconds }) => {
  const [countdown, setCountdown] = useState(timeoutSeconds);

  useEffect(() => {
    if (isOpen) {
      setCountdown(timeoutSeconds);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            onLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, timeoutSeconds, onLogout]);
  
  if (!isOpen) {
    return null;
  }

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-8 text-center transform transition-all duration-300 scale-100">
        <ClockIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">세션 만료 알림</h2>
        <p className="text-gray-600 mb-6">
          보안을 위해 활동이 없어 세션이 곧 만료됩니다.
          <br />
          <span className="font-bold text-indigo-600 text-lg">{minutes}:{seconds.toString().padStart(2, '0')}</span> 후 자동으로 초기화됩니다.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onContinue}
            className="px-8 py-3 text-lg font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            세션 연장
          </button>
          <button
            onClick={onLogout}
            className="px-8 py-3 text-lg font-semibold bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            지금 초기화
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;
