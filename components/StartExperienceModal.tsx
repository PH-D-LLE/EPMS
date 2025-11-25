import React, { useState, useEffect } from 'react';
import { XIcon } from './icons';

interface StartExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, memo: string) => void;
  slotNumber: number;
}

const StartExperienceModal: React.FC<StartExperienceModalProps> = ({ isOpen, onClose, onConfirm, slotNumber }) => {
  const [name, setName] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setName('');
      setMemo('');
      // Set timeout to focus after transition
      setTimeout(() => {
        const nameInput = document.getElementById('modal-participant-name');
        if (nameInput) {
          nameInput.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') {
      alert('체험자 이름은 필수입니다.');
      return;
    }
    onConfirm(name.trim(), memo.trim());
  };

  if (!isOpen) {
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
        <h2 className="text-3xl font-bold mb-6 text-gray-800">{slotNumber}번 자리 체험 시작</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="modal-participant-name" className="block text-base font-medium text-gray-700">
                체험자 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="modal-participant-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 block w-full shadow-sm text-xl p-5 h-16 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="이름을 입력하세요"
                required
              />
            </div>
            <div>
              <label htmlFor="modal-memo" className="block text-base font-medium text-gray-700">
                메모 (선택사항)
              </label>
              <input
                type="text"
                id="modal-memo"
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
              className="px-6 py-4 text-lg bg-green-500 text-white font-bold rounded-md hover:bg-green-600 transition-colors"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartExperienceModal;
