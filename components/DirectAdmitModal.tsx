import React from 'react';
import type { Slot } from '../types';
import { XIcon, UsersIcon } from './icons';

interface DirectAdmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (slotId: number) => void;
  participantName: string;
  participantPhoneNumber: string;
  availableSlots: Slot[];
}

const DirectAdmitModal: React.FC<DirectAdmitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  participantName,
  participantPhoneNumber,
  availableSlots,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-8 relative transform transition-all duration-300 scale-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-bold mb-2 text-gray-800">바로 입장</h2>
        <p className="text-lg text-gray-500 mb-6">참가자를 입장시킬 자리를 선택해주세요.</p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
          <UsersIcon className="w-16 h-16 text-green-500 mx-auto mb-3" />
          <p className="text-4xl font-bold text-green-800">{participantName}</p>
          <p className="text-xl text-green-700 mt-1">{participantPhoneNumber}</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-700 text-center mb-4">선택 가능한 자리:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {availableSlots.map((slot, index) => (
              <button
                key={slot.id}
                onClick={() => onConfirm(slot.id)}
                className="p-6 border-2 border-indigo-500 text-indigo-600 font-bold text-lg rounded-lg hover:bg-indigo-500 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {index + 1}번 자리
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 text-lg bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectAdmitModal;
