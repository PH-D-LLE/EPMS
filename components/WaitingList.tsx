import React, { useState, useEffect } from 'react';
import type { Waiter } from '../types';
import { PaperAirplaneIcon, TrashIcon, UsersIcon, ChatBubbleIcon } from './icons';

interface WaitingListProps {
  waitingList: Waiter[];
  onAdd: (name: string, phoneNumber: string) => void;
  onDelete: (id: string) => void;
  onNotify: (waiter: Waiter) => void;
  onSendWaitingMessage: (waiter: Waiter) => void;
  onDirectAdmit: (name: string, phoneNumber: string, clearForm: () => void) => void;
  hasEmptySlots: boolean;
}

interface WaiterItemProps {
  waiter: Waiter;
  index: number;
  onDelete: (id: string) => void;
  onNotify: (waiter: Waiter) => void;
  onSendWaitingMessage: (waiter: Waiter) => void;
}

const WaiterItem: React.FC<WaiterItemProps> = ({ waiter, index, onDelete, onNotify, onSendWaitingMessage }) => {
  const [elapsedTime, setElapsedTime] = useState<string>('');

  useEffect(() => {
    let timerInterval: number | undefined;

    if (waiter.notifiedAt) {
      const calculateElapsedTime = () => {
        const notifiedTime = new Date(waiter.notifiedAt as Date);
        const now = new Date();
        const diff = now.getTime() - notifiedTime.getTime();

        if (diff < 0) return;

        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const pad = (num: number) => num.toString().padStart(2, '0');
        
        setElapsedTime(`${pad(minutes)}:${pad(seconds)}`);
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
  }, [waiter.notifiedAt]);

  return (
    <div className="flex items-center justify-between bg-slate-50 p-5 rounded-lg border border-slate-200">
      <div className="flex items-center">
        <span className="text-lg font-bold bg-indigo-100 text-indigo-800 rounded-full w-10 h-10 flex items-center justify-center mr-4">{index + 1}</span>
        <div>
          <p className="font-bold text-xl text-gray-800">{waiter.name}</p>
          <p className="text-lg text-gray-500">{waiter.phoneNumber}</p>
          {waiter.notifiedAt && (
            <p className="text-base font-semibold text-red-600 mt-1 animate-pulse">
              호출 후 {elapsedTime} 경과
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onSendWaitingMessage(waiter)}
          className="flex items-center justify-center space-x-2 bg-cyan-500 text-white font-semibold py-3 px-5 rounded-lg hover:bg-cyan-600 transition-colors duration-200 text-base"
          aria-label={`${waiter.name}님에게 대기 안내 문자 보내기`}
        >
          <ChatBubbleIcon className="w-5 h-5" />
          <span>안내</span>
        </button>
        {waiter.notified ? (
          <>
            <button
              disabled
              className="flex items-center justify-center space-x-2 bg-gray-400 text-white font-semibold py-3 px-5 rounded-lg cursor-not-allowed text-base"
              aria-label={`${waiter.name}님에게 알림을 보냈습니다.`}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              <span>호출 완료</span>
            </button>
            <button
              onClick={() => onNotify(waiter)}
              className="flex items-center justify-center bg-blue-500 text-white font-semibold py-3 px-5 rounded-lg hover:bg-blue-600 transition-colors duration-200 text-base"
              aria-label={`${waiter.name}님에게 알림 재발송하기`}
            >
              재호출
            </button>
          </>
        ) : (
          <button
            onClick={() => onNotify(waiter)}
            className="flex items-center justify-center space-x-2 bg-green-500 text-white font-semibold py-3 px-5 rounded-lg hover:bg-green-600 transition-colors duration-200 text-base"
            aria-label={`${waiter.name}님에게 호출 문자 보내기`}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
            <span>호출</span>
          </button>
        )}
        <button 
          onClick={() => onDelete(waiter.id)} 
          className="p-3 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          aria-label={`${waiter.name}님 대기열에서 삭제`}
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};


const WaitingList: React.FC<WaitingListProps> = ({ waitingList, onAdd, onDelete, onNotify, onSendWaitingMessage, onDirectAdmit, hasEmptySlots }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phoneNumber.trim()) {
      onAdd(name.trim(), phoneNumber.trim());
      setName('');
      setPhoneNumber('');
    } else {
      alert('이름과 전화번호를 모두 입력해주세요.');
    }
  };

  const handleDirectAdmitClick = () => {
    if (name.trim() && phoneNumber.trim()) {
      onDirectAdmit(name.trim(), phoneNumber.trim(), () => {
        setName('');
        setPhoneNumber('');
      });
    } else {
      alert('이름과 전화번호를 모두 입력해주세요.');
    }
  };

  return (
    <section className="bg-white p-6 rounded-xl shadow-lg w-full">
      <h2 className="flex items-center text-3xl font-bold text-gray-800 mb-8">
        <UsersIcon className="w-8 h-8 mr-3 text-indigo-500" />
        대기자 관리
      </h2>
      <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 items-center">
        <div className="md:col-span-1">
          <label htmlFor="waiter-name" className="sr-only">대기자 이름</label>
          <input
            type="text"
            id="waiter-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full text-lg p-5 h-16 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="대기자 이름"
          />
        </div>
        <div className="md:col-span-1">
          <label htmlFor="waiter-phone" className="sr-only">전화번호</label>
          <input
            type="tel"
            id="waiter-phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="block w-full text-lg p-5 h-16 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="전화번호 (예: 01012345678)"
          />
        </div>
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="submit"
            className="w-full h-16 bg-indigo-600 text-white font-bold py-4 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-lg"
          >
            대기자 추가
          </button>
          <button
            type="button"
            onClick={handleDirectAdmitClick}
            disabled={!hasEmptySlots}
            className="w-full h-16 bg-green-600 text-white font-bold py-4 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            바로 입장
          </button>
        </div>
      </form>
      <div className="max-h-[1000px] overflow-y-auto space-y-4 pr-2">
        {waitingList.length === 0 ? (
          <div className="text-gray-500 text-center py-12 border-2 border-dashed rounded-lg">
            <UsersIcon className="w-16 h-16 mx-auto text-gray-300 mb-4"/>
            <p className="text-lg">대기자가 없습니다.</p>
          </div>
        ) : (
          waitingList.map((waiter, index) => (
            <WaiterItem 
              key={waiter.id}
              waiter={waiter}
              index={index}
              onDelete={onDelete}
              onNotify={onNotify}
              onSendWaitingMessage={onSendWaitingMessage}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default WaitingList;