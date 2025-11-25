import React from 'react';
import type { ParticipantHistory } from '../types';

interface HistoryTableProps {
  history: ParticipantHistory[];
}

const HistoryTable: React.FC<HistoryTableProps> = ({ history }) => {
  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-lg mt-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">체험 기록</h2>
      <div className="max-h-96 overflow-y-auto">
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-8">아직 체험 기록이 없습니다.</p>
        ) : (
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3 rounded-l-lg">자리 번호</th>
                <th scope="col" className="px-6 py-3">체험자 이름</th>
                <th scope="col" className="px-6 py-3">메모</th>
                <th scope="col" className="px-6 py-3">입장 시간</th>
                <th scope="col" className="px-6 py-3">퇴장 시간</th>
                <th scope="col" className="px-6 py-3 rounded-r-lg">소요 시간</th>
              </tr>
            </thead>
            <tbody>
              {[...history].sort((a, b) => b.entryTime.getTime() - a.entryTime.getTime()).map((record) => {
                let durationStr = '-';
                if (record.exitTime) {
                  const diff = record.exitTime.getTime() - record.entryTime.getTime();
                  if (diff >= 0) {
                    const totalSeconds = Math.floor(diff / 1000);
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    const seconds = totalSeconds % 60;
                    const pad = (num: number) => num.toString().padStart(2, '0');
                    durationStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
                  }
                }
                
                return (
                  <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{record.slotNumber}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{record.participantName}</td>
                    <td className="px-6 py-4">{record.memo || '-'}</td>
                    <td className="px-6 py-4">{record.entryTime.toLocaleString('ko-KR')}</td>
                    <td className="px-6 py-4">
                      {record.exitTime ? record.exitTime.toLocaleString('ko-KR') : <span className="text-blue-500 font-semibold">체험 중</span>}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {durationStr}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default HistoryTable;