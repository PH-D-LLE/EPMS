import React, { useState, useEffect } from 'react';
import type { Slot } from '../types';
import { ClockIcon } from './icons';

interface SlotCardProps {
  slot: Slot;
  slotNumber: number;
  onStart: (slotId: number) => void;
  onEnd: (slotId: number) => void;
  hasWaiters: boolean;
}

const SlotCard: React.FC<SlotCardProps> = ({ slot, slotNumber, onStart, onEnd, hasWaiters }) => {
  const [elapsedTime, setElapsedTime] = useState<string>('');
  const isOccupied = slot.participantName !== null;

  useEffect(() => {
    let timerInterval: number | undefined;

    if (slot.entryTime) {
      const calculateElapsedTime = () => {
        const now = new Date();
        const entry = new Date(slot.entryTime!); // entryTime can be string if state is serialized
        const diff = now.getTime() - entry.getTime();

        if (diff < 0) return;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const pad = (num: number) => num.toString().padStart(2, '0');
        
        setElapsedTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      };

      calculateElapsedTime();
      timerInterval = window.setInterval(calculateElapsedTime, 1000);
    } else {
      setElapsedTime('');
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [slot.entryTime]);

  return (
    <div className={`
      bg-white border rounded-xl p-8 text-center transition-all duration-300 flex flex-col justify-between
      ${isOccupied ? 'border-indigo-200 shadow-lg' : 'border-gray-200'}
    `}>
      <div>
        <h3 className="text-3xl font-bold text-indigo-600">{slotNumber}번</h3>
        <div className="mt-6 min-h-[140px] flex flex-col justify-center items-center">
          {isOccupied ? (
            <>
              <p className="text-4xl font-bold text-gray-800 break-all">{slot.participantName}</p>
              <div className="flex items-center justify-center mt-3 text-base text-indigo-700 font-medium">
                <ClockIcon className="w-5 h-5 mr-2" />
                <span>{elapsedTime}</span>
              </div>
              <p className="text-base text-gray-500 mt-2">{slot.memo || ' '}</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-semibold text-green-600">비어있음</p>
              <p className="text-lg text-gray-400 mt-2">-</p>
            </>
          )}
        </div>
      </div>
      <div className="mt-6">
        {isOccupied ? (
          <button
            onClick={() => onEnd(slot.id)}
            className="w-full bg-yellow-500 text-white font-bold py-4 px-6 rounded-lg hover:bg-yellow-600 transition-colors duration-200 text-lg"
          >
            체험 종료
          </button>
        ) : (
          <button
            onClick={() => onStart(slot.id)}
            className={`w-full text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 text-lg ${
              hasWaiters 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {hasWaiters ? '대기자 입장' : '체험 시작'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SlotCard;
