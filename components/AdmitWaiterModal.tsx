import React, { useState, useEffect } from 'react';
import type { Waiter } from '../types';
import { XIcon, UsersIcon } from './icons';

interface AdmitWaiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (memo: string) => void;
  waiter: Waiter | null;
  slotNumber: number;
}

const AdmitWaiterModal: React.FC<AdmitWaiterModalProps> = ({ isOpen, onClose, onConfirm, waiter, slotNumber }) => {
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMemo('');
      setTimeout(() => {
        const memoInput = document.getElementById('modal-admit-memo');
        if (memoInput) {
          memoInput.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(memo.trim());
  };

  if (!isOpen || !waiter) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300" 
      aria-modal="true" 
      role="dialog"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8 relative transform transition-all duration-300 scale-100">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-bold mb-2 text-gray-800">{slotNumber}번 자리 대기자 입장</h2>
        <p className="text-lg text-gray-500 mb-6">1번 대기자를 체험에 참여시킵니다.</p>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6 text-center">
            <UsersIcon className="w-16 h-16 text-indigo-400 mx-auto mb-3" />
            <p className="text-4xl font-bold text-indigo-800">{waiter.name}</p>
            <p className="text-xl text-indigo-600 mt-1">{waiter.phoneNumber}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="modal-admit-memo" className="block text-base font-medium text-gray-700">
                메모 (선택사항)
              </label>
              <input
                type="text"
                id="modal-admit-memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="mt-2 block w-full shadow-sm text-xl p-5 h-16 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="추가 정보"
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-4 text-lg bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-4 text-lg bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 transition-colors"
            >
              입장시키기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdmitWaiterModal;
