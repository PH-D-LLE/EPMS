import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Slot, ParticipantHistory, Waiter } from './types';
import SlotCard from './components/SlotCard';
import HistoryTable from './components/HistoryTable';
import StartExperienceModal from './components/StartExperienceModal';
import AdmitWaiterModal from './components/AdmitWaiterModal';
import WaitingList from './components/WaitingList';
import SessionTimeoutModal from './components/SessionTimeoutModal';
import DirectAdmitModal from './components/DirectAdmitModal';
import { 
  UsersIcon, GridIcon, EditIcon, BarChartIcon, 
  PlayIcon, StopIcon, XIcon, DownloadIcon, ClockIcon,
  DatabaseIcon, UploadIcon, RefreshIcon
} from './components/icons';

interface AppState {
  slots: Slot[];
  history: ParticipantHistory[];
  waitingList: Waiter[];
}

const APP_STATE_KEY = 'experience-app-state';

// Session timeout constants
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes before timeout

const saveFileWithPicker = async (blob: Blob, suggestedName: string, types: { description: string; accept: Record<string, string[]> }[]): Promise<boolean> => {
    try {
        const handle = await window.showSaveFilePicker({
            suggestedName,
            types,
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true; // Success
    } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
            // User cancelled the save dialog. This is not an error.
        } else {
            console.error('Failed to save file with picker:', err);
            alert(`파일 저장에 실패했습니다: ${err.message}`);
        }
        return false; // Failure or cancellation
    }
};

const getInitialState = (): AppState => ({
  slots: Array.from({ length: 3 }, (_, i) => ({ id: i, participantName: null, memo: null, entryTime: null })),
  history: [],
  waitingList: [],
});

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(() => {
    const savedState = localStorage.getItem(APP_STATE_KEY);
    if (!savedState) {
      return getInitialState();
    }
    try {
      const parsed = JSON.parse(savedState);
       if (!parsed.slots || !parsed.history || !parsed.waitingList) {
        throw new Error("Invalid state structure in localStorage");
      }
      return {
        slots: parsed.slots.map((slot: any) => ({
          ...slot,
          entryTime: slot.entryTime ? new Date(slot.entryTime) : null,
        })),
        history: parsed.history.map((record: any) => ({
          ...record,
          entryTime: new Date(record.entryTime),
          exitTime: record.exitTime ? new Date(record.exitTime) : null,
        })),
        waitingList: parsed.waitingList.map((waiter: any) => ({
          ...waiter,
          notifiedAt: waiter.notifiedAt ? new Date(waiter.notifiedAt) : null,
        })),
      };
    } catch (error) {
      console.error("Failed to load state from localStorage, resetting state.", error);
      alert("저장된 데이터를 불러오는 중 오류가 발생하여 시스템을 초기화합니다. 기존 데이터는 삭제됩니다.");
      localStorage.removeItem(APP_STATE_KEY);
      return getInitialState();
    }
  });
  
  const { slots, history, waitingList } = appState;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Session Timeout State
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);
  const warningTimer = useRef<number | null>(null);

  const updateStateAndPersist = useCallback((updater: (prevState: AppState) => AppState) => {
    setAppState(prevState => {
      const newState = updater(prevState);
      try {
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(newState));
      } catch (error) {
        console.error("Failed to save state to localStorage", error);
        alert('데이터 저장에 실패했습니다. 새로고침 후 다시 시도해주세요.');
      }
      return newState;
    });
  }, []);

  // Form state
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [participantName, setParticipantName] = useState<string>('');
  const [memo, setMemo] = useState<string>('');

  // UI state
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [slotCountInput, setSlotCountInput] = useState<string>('3');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [modalSlotId, setModalSlotId] = useState<number | null>(null);
  const [isDirectAdmitModalOpen, setIsDirectAdmitModalOpen] = useState(false);
  const [directAdmitParticipantInfo, setDirectAdmitParticipantInfo] = useState<{name: string, phoneNumber: string} | null>(null);
  const [onAdmitSuccessCallback, setOnAdmitSuccessCallback] = useState<(() => void) | null>(null);
  
  const forceSystemReset = useCallback(() => {
    try {
      const initialState = getInitialState();
      updateStateAndPersist(() => initialState);
      
      // Reset local component UI state
      setSelectedSlotId('');
      setParticipantName('');
      setMemo('');
      setShowHistory(false);
      setSlotCountInput(String(initialState.slots.length));
      setIsModalOpen(false);
      setIsAdmitModalOpen(false);
      setModalSlotId(null);
      
      alert('시스템이 성공적으로 초기화되었습니다.');

    } catch (error) {
      console.error("Failed to clear state and reset:", error);
      alert('데이터 초기화에 실패했습니다.');
    }
  }, [updateStateAndPersist]);

  // Session Timeout Logic
  const resetActivityTimer = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    
    warningTimer.current = window.setTimeout(() => {
      setIsTimeoutModalOpen(true);
    }, INACTIVITY_TIMEOUT_MS - WARNING_TIMEOUT_MS);
  }, []);
  
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    
    const handleActivity = () => {
      if (!isTimeoutModalOpen) {
        resetActivityTimer();
      }
    };

    events.forEach(event => window.addEventListener(event, handleActivity));
    resetActivityTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (warningTimer.current) clearTimeout(warningTimer.current);
    };
  }, [isTimeoutModalOpen, resetActivityTimer]);

  const handleContinueSession = () => {
    setIsTimeoutModalOpen(false);
    resetActivityTimer();
  };

  useEffect(() => {
    // When a slot is selected from the dropdown, populate the form
    if (selectedSlotId) {
      const slot = slots.find(s => s.id === parseInt(selectedSlotId, 10));
      if (slot && slot.participantName) {
        setParticipantName(slot.participantName);
        setMemo(slot.memo || '');
      } else {
        setParticipantName('');
        setMemo('');
      }
    } else {
      setParticipantName('');
      setMemo('');
    }
  }, [selectedSlotId, slots]);

  useEffect(() => {
    setSlotCountInput(String(slots.length));
  }, [slots.length]);
  
  const handleUpdateSlotCount = () => {
    const newCount = parseInt(slotCountInput, 10);
    if (isNaN(newCount) || newCount < 1 || newCount > 50) {
      alert('유효한 자리 수를 입력해주세요 (1-50).');
      setSlotCountInput(String(slots.length));
      return;
    }

    if (newCount === slots.length) return;

    if (newCount < slots.length) {
      const slotsToRemove = slots.slice(newCount);
      if (slotsToRemove.some(slot => slot.participantName !== null)) {
        alert('체험 중인 참가자가 있어 자리 수를 줄일 수 없습니다. 먼저 해당 자리의 체험을 종료해주세요.');
        setSlotCountInput(String(slots.length));
        return;
      }
    }
    
    let newSlots;
    const currentLength = slots.length;
    if (newCount > currentLength) {
      const newSlotsToAdd = Array.from({ length: newCount - currentLength }, (_, i) => ({
        id: currentLength + i,
        participantName: null,
        memo: null,
        entryTime: null,
      }));
      newSlots = [...slots, ...newSlotsToAdd];
    } else {
      newSlots = slots.slice(0, newCount);
    }
    
    updateStateAndPersist(prevState => ({
      ...prevState,
      slots: newSlots,
    }));
    setSelectedSlotId('');
  };
  
  const admitParticipant = useCallback((
    slotId: number,
    name: string,
    memo: string | null,
    options?: { removeFirstWaiter: boolean }
  ) => {
    updateStateAndPersist(prevState => {
      const participantName = options?.removeFirstWaiter ? prevState.waitingList[0]?.name : name;
      if (!participantName) {
        console.error("Participant name is missing for admission.");
        return prevState; // Do nothing if name is invalid
      }
  
      const entryTime = new Date();
      const newSlots = prevState.slots.map(slot =>
        slot.id === slotId
        ? { ...slot, participantName: participantName.trim(), memo: memo ? memo.trim() : null, entryTime }
        : slot
      );
      const newHistoryEntry: ParticipantHistory = {
        id: crypto.randomUUID(),
        slotNumber: slotId + 1,
        participantName: participantName.trim(),
        memo: memo ? memo.trim() : null,
        entryTime,
        exitTime: null
      };
      
      return {
        ...prevState,
        slots: newSlots,
        history: [newHistoryEntry, ...prevState.history],
        waitingList: options?.removeFirstWaiter ? prevState.waitingList.slice(1) : prevState.waitingList,
      };
    });
  }, [updateStateAndPersist]);


  const handleStartExperience = () => {
    if (!selectedSlotId || !participantName.trim()) {
      alert('자리 번호와 체험자 이름을 모두 입력해주세요.');
      return;
    }
    
    const slotId = parseInt(selectedSlotId, 10);
    const targetSlot = slots.find(s => s.id === slotId);

    if (!targetSlot) return;

    if (targetSlot.participantName) {
      alert('이미 사용 중인 자리입니다.');
      return;
    }
    
    admitParticipant(slotId, participantName, memo);
    setSelectedSlotId('');
  };

  const handleStartFromCard = (slotId: number) => {
    setModalSlotId(slotId);
    if (waitingList.length > 0) {
      setIsAdmitModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };
  
  const handleConfirmStart = (name: string, memo: string) => {
    if (modalSlotId === null) return;
    admitParticipant(modalSlotId, name, memo);
    handleCloseModal();
  };

  const handleConfirmAdmitWaiter = (memo: string) => {
    if (modalSlotId === null || waitingList.length === 0) return;
    admitParticipant(modalSlotId, '', memo, { removeFirstWaiter: true });
    handleCloseAdmitModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalSlotId(null);
  };

  const handleCloseAdmitModal = () => {
    setIsAdmitModalOpen(false);
    setModalSlotId(null);
  };

  const handleOpenDirectAdmitModal = useCallback((name: string, phoneNumber: string, clearForm: () => void) => {
    if (!slots.some(s => s.participantName === null)) {
      alert("빈 자리가 없습니다. 대기 명단에 추가해주세요.");
      return;
    }
    setDirectAdmitParticipantInfo({ name, phoneNumber });
    setOnAdmitSuccessCallback(() => clearForm);
    setIsDirectAdmitModalOpen(true);
  }, [slots]);

  const handleCloseDirectAdmitModal = useCallback(() => {
    setIsDirectAdmitModalOpen(false);
    setDirectAdmitParticipantInfo(null);
    setOnAdmitSuccessCallback(null);
  }, []);

  const handleConfirmDirectAdmit = useCallback((slotId: number) => {
    if (!directAdmitParticipantInfo) return;
    admitParticipant(slotId, directAdmitParticipantInfo.name, directAdmitParticipantInfo.phoneNumber);
    if (onAdmitSuccessCallback) {
        onAdmitSuccessCallback();
    }
    handleCloseDirectAdmitModal();
  }, [admitParticipant, directAdmitParticipantInfo, onAdmitSuccessCallback, handleCloseDirectAdmitModal]);


  const handleEndExperience = (slotId: number) => {
    const slotToClear = slots.find(s => s.id === slotId);
    if (!slotToClear || !slotToClear.participantName || !slotToClear.entryTime) return;

    const exitTime = new Date();
    
    updateStateAndPersist(prevState => {
      const newHistory = prevState.history.map(h => 
        (h.slotNumber === (slotToClear.id + 1) && h.exitTime === null) 
        ? { ...h, exitTime } 
        : h
      );

      const newSlots = prevState.slots.map(slot => 
        slot.id === slotId
        ? { ...slot, participantName: null, memo: null, entryTime: null }
        : slot
      );

      return {
          ...prevState,
          history: newHistory,
          slots: newSlots,
      }
    });
    
    if (String(slotId) === selectedSlotId) {
        setSelectedSlotId('');
    }
  };

  const handleSystemReset = () => {
    if (window.confirm('정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없으며, 자리 수도 기본값(3개)으로 재설정됩니다.')) {
      forceSystemReset();
    }
  };
  
  const handleDownloadCSV = async (saveAs = false) => {
    const now = new Date();
    const fileName = `전체_체험기록_${now.toISOString().split('T')[0]}.csv`;
    const header = "상태,자리 번호,체험자 이름,전화번호,메모,입장 시간,퇴장 시간,소요 시간,호출 여부,호출 시간\n";

    const formatDateTime = (date: Date | null) => date ? `"${date.toLocaleString('ko-KR')}"` : '""';

    const formatDuration = (start: Date, end: Date | null): string => {
      if (!start) return '""';
      const endTime = end || now;
      const diff = endTime.getTime() - new Date(start).getTime();
      if (diff < 0) return '""';
      
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const pad = (num: number) => num.toString().padStart(2, '0');
      return `"${pad(hours)}:${pad(minutes)}:${pad(seconds)}"`;
    };
    
    const currentParticipantsRows = slots
      .filter(slot => slot.participantName && slot.entryTime)
      .map(slot => {
        const entryTime = new Date(slot.entryTime!);
        return [
          '"체험 중"', slot.id + 1, `"${slot.participantName}"`, '""', `"${slot.memo || ''}"`,
          formatDateTime(entryTime), '""', formatDuration(entryTime, null), '""', '""'
        ].join(',');
      });

    const waitingListRows = waitingList.map(w => {
      return [
        '"대기 중"', '""', `"${w.name}"`, `"${w.phoneNumber}"`, '""',
        '""', '""', '""', w.notified ? '"예"' : '"아니오"',
        formatDateTime(w.notifiedAt ? new Date(w.notifiedAt) : null)
      ].join(',');
    });

    const pastParticipantsRows = history
      .filter(h => h.exitTime)
      .sort((a, b) => new Date(b.exitTime!).getTime() - new Date(a.exitTime!).getTime())
      .map(h => {
        const entryTime = new Date(h.entryTime);
        const exitTime = new Date(h.exitTime!);
        return [
          '"체험 완료"', h.slotNumber, `"${h.participantName}"`, '""', `"${h.memo || ''}"`,
          formatDateTime(entryTime), formatDateTime(exitTime), formatDuration(entryTime, exitTime), '""', '""'
        ].join(',');
      });

    const allRows = [...currentParticipantsRows, ...waitingListRows, ...pastParticipantsRows].join('\n');
    const csvContent = header + allRows;
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });

    if (saveAs && 'showSaveFilePicker' in window) {
        const success = await saveFileWithPicker(blob, fileName, [{
            description: 'CSV Files',
            accept: { 'text/csv': ['.csv'] },
        }]);
        if (success) alert('파일이 성공적으로 저장되었습니다.');
        return;
    }

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    if (saveAs) {
        alert('\'다른 이름으로 저장\'은 현재 브라우저에서 지원되지 않습니다. 기본 다운로드를 실행합니다.');
    } else {
        alert('리포트(CSV) 파일이 다운로드 폴더에 저장되었습니다.');
    }
  };
  
  const handleBackupJSON = async (saveAs = false) => {
    const stateToSave = { slots: appState.slots, history: appState.history, waitingList: appState.waitingList };
    const jsonString = JSON.stringify(stateToSave, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const now = new Date();
    const fileName = `체험프로그램_백업_${now.toISOString().split('T')[0]}.json`;
    
    if (saveAs && 'showSaveFilePicker' in window) {
        const success = await saveFileWithPicker(blob, fileName, [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
        }]);
        if (success) alert('파일이 성공적으로 저장되었습니다.');
        return;
    }

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    if (saveAs) {
        alert('\'다른 이름으로 저장\'은 현재 브라우저에서 지원되지 않습니다. 기본 다운로드를 실행합니다.');
    } else {
        alert('백업(JSON) 파일이 다운로드 폴더에 저장되었습니다.');
    }
  };

  const handleRestoreClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      const inputElement = event.target;
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') throw new Error("File content is not a string.");
              
              const parsedState = JSON.parse(text);

              if (!parsedState.slots || !parsedState.history || !parsedState.waitingList) {
                  throw new Error("Invalid backup file format.");
              }

              if (window.confirm('백업 파일로 현재 데이터를 덮어쓰시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                  const restoredState: AppState = {
                      slots: parsedState.slots.map((slot: any) => ({
                          ...slot,
                          entryTime: slot.entryTime ? new Date(slot.entryTime) : null,
                      })),
                      history: parsedState.history.map((record: any) => ({
                          ...record,
                          entryTime: new Date(record.entryTime),
                          exitTime: record.exitTime ? new Date(record.exitTime) : null,
                      })),
                      waitingList: parsedState.waitingList.map((waiter: any) => ({
                          ...waiter,
                          notifiedAt: waiter.notifiedAt ? new Date(waiter.notifiedAt) : null,
                      })),
                  };
                  updateStateAndPersist(() => restoredState);
                  alert('데이터가 성공적으로 복구되었습니다.');
              }
          } catch (error) {
              console.error("Failed to restore state:", error);
              alert('백업 파일이 유효하지 않거나 읽는 데 실패했습니다.');
          } finally {
              if(inputElement) {
                  inputElement.value = '';
              }
          }
      };
      reader.readAsText(file);
  };

  const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear();
  };

  const stats = useMemo(() => {
    const totalParticipants = history.filter(h => h.exitTime === null).length + history.filter(h => h.exitTime !== null).length;
    const currentlyIn = slots.filter(s => s.participantName !== null).length;
    const completedToday = history.filter(h => h.exitTime && isToday(new Date(h.exitTime))).length;
    return { totalParticipants, currentlyIn, completedToday };
  }, [history, slots]);
  
  const selectedSlot = slots.find(s => s.id === parseInt(selectedSlotId, 10));
  const isSlotOccupied = selectedSlot ? selectedSlot.participantName !== null : false;

  const gridColsClass = useMemo(() => {
    const count = slots.length;
    if (count <= 0) return 'grid grid-cols-1 gap-4';
    if (count === 1) return 'grid grid-cols-1 gap-4';
    if (count === 2) return 'grid grid-cols-2 gap-4';
    if (count === 3) return 'grid grid-cols-3 gap-4';
    return `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`;
  }, [slots.length]);

  const handleAddWaiter = (name: string, phoneNumber: string) => {
    const newWaiter: Waiter = {
      id: crypto.randomUUID(),
      name,
      phoneNumber,
      notified: false,
      notifiedAt: null,
    };
    updateStateAndPersist(prevState => ({
      ...prevState,
      waitingList: [...prevState.waitingList, newWaiter],
    }));

    // Automatically send waiting notification
    const waitingPosition = waitingList.length + 1;
    const cleanedPhoneNumber = newWaiter.phoneNumber.replace(/\D/g, '');
    const message = `[경상북도평생교육사협회 체험 프로그램] 안녕하세요, ${newWaiter.name}님. 대기 명단에 등록되셨습니다. 현재 대기 ${waitingPosition}번째입니다. 자리가 준비되면 다시 알려드리겠습니다.`;
    const encodedMessage = encodeURIComponent(message);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const separator = isIOS ? '&' : '?';
    
    const smsLink = `sms:${cleanedPhoneNumber}${separator}body=${encodedMessage}`;

    window.open(smsLink);
  };
  
  const handleDeleteWaiter = (id: string) => {
    updateStateAndPersist(prevState => ({
      ...prevState,
      waitingList: prevState.waitingList.filter(waiter => waiter.id !== id),
    }));
  };

  const handleSendNotification = (waiter: Waiter) => {
    const cleanedPhoneNumber = waiter.phoneNumber.replace(/\D/g, '');
    const message = `[경상북도평생교육사협회 체험 프로그램] 안녕하세요, ${waiter.name}님! 자리가 준비되었습니다. 5분 내에 오지 않으면 취소하오니, 지금 바로 와주세요.`;
    const encodedMessage = encodeURIComponent(message);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const separator = isIOS ? '&' : '?';
    
    const smsLink = `sms:${cleanedPhoneNumber}${separator}body=${encodedMessage}`;

    const newWaitingList = waitingList.map(w =>
      w.id === waiter.id ? { ...w, notified: true, notifiedAt: new Date() } : w
    );

    updateStateAndPersist(prevState => ({
      ...prevState,
      waitingList: newWaitingList,
    }));
    window.open(smsLink);
  };
  
  const handleSendWaitingNotification = (waiter: Waiter) => {
    const waitingPosition = waitingList.findIndex(w => w.id === waiter.id) + 1;
    const cleanedPhoneNumber = waiter.phoneNumber.replace(/\D/g, '');
    const message = `[경상북도평생교육사협회 체험 프로그램] 안녕하세요, ${waiter.name}님. 대기 명단에 등록되셨습니다. 현재 대기 ${waitingPosition}번째입니다. 자리가 준비되면 다시 알려드리겠습니다.`;
    const encodedMessage = encodeURIComponent(message);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const separator = isIOS ? '&' : '?';
    
    const smsLink = `sms:${cleanedPhoneNumber}${separator}body=${encodedMessage}`;

    window.open(smsLink);
  };
  
  const hasEmptySlots = useMemo(() => slots.some(s => s.participantName === null), [slots]);

  return (
    <>
      <SessionTimeoutModal
        isOpen={isTimeoutModalOpen}
        onContinue={handleContinueSession}
        onLogout={forceSystemReset}
        timeoutSeconds={WARNING_TIMEOUT_MS / 1000}
      />
      <DirectAdmitModal
        isOpen={isDirectAdmitModalOpen}
        onClose={handleCloseDirectAdmitModal}
        onConfirm={handleConfirmDirectAdmit}
        participantName={directAdmitParticipantInfo?.name || ''}
        participantPhoneNumber={directAdmitParticipantInfo?.phoneNumber || ''}
        availableSlots={slots.filter(s => s.participantName === null)}
      />
      <div className="bg-slate-100 min-h-screen font-sans">
        <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 shadow-md">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center space-x-3">
              <UsersIcon className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-extrabold">체험 프로그램 관리 시스템</h1>
                <p className="text-indigo-200 mt-1">{slots.length}개 자리 실시간 상태 관리</p>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
          <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              {/* 체험 자리 현황 */}
              <section className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="flex items-center text-xl font-bold text-gray-800 mb-4">
                  <GridIcon className="w-6 h-6 mr-2 text-indigo-500"/>
                  체험 자리 현황
                </h2>
                <div className={gridColsClass}>
                  {slots.map((slot, index) => (
                    <SlotCard 
                      key={slot.id} 
                      slot={slot} 
                      slotNumber={index + 1}
                      onStart={handleStartFromCard}
                      onEnd={handleEndExperience}
                      hasWaiters={waitingList.length > 0}
                    />
                  ))}
                </div>
              </section>
              
              <WaitingList 
                waitingList={waitingList}
                onAdd={handleAddWaiter}
                onDelete={handleDeleteWaiter}
                onNotify={handleSendNotification}
                onSendWaitingMessage={handleSendWaitingNotification}
                onDirectAdmit={handleOpenDirectAdmitModal}
                hasEmptySlots={hasEmptySlots}
              />
            </div>
            
            {/* 통계 및 관리 */}
            <div className="md:col-span-1 space-y-8">
              <section className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="flex items-center text-xl font-bold text-gray-800 mb-4">
                  <BarChartIcon className="w-6 h-6 mr-2 text-indigo-500"/>
                  통계 및 관리
                </h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                    <p className="text-sm">총 체험자</p>
                    <p className="text-3xl font-bold">{stats.totalParticipants}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                    <p className="text-sm">현재 체험 중</p>
                    <p className="text-3xl font-bold">{stats.currentlyIn}</p>
                  </div>
                   <div className="p-4 rounded-lg bg-gradient-to-r from-sky-500 to-purple-500 text-white">
                    <p className="text-sm">오늘 완료</p>
                    <p className="text-3xl font-bold">{stats.completedToday}</p>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                  <label htmlFor="slot-count-input" className="block text-sm font-medium text-gray-700 mb-2">
                    체험 자리 수 설정
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      id="slot-count-input"
                      value={slotCountInput}
                      onChange={(e) => setSlotCountInput(e.target.value)}
                      min="1"
                      className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="자리 수"
                      aria-label="체험 자리 수"
                    />
                    <button
                      onClick={handleUpdateSlotCount}
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap"
                    >
                      적용
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="p-3 rounded-lg border border-gray-200 bg-slate-50">
                      <p className="text-sm font-medium text-gray-700 mb-2 text-center">리포트 (CSV)</p>
                      <div className="grid grid-cols-2 gap-2">
                          <button
                              onClick={() => handleDownloadCSV(false)}
                              disabled={history.length === 0 && waitingList.length === 0 && slots.every(s => s.participantName === null)}
                              className="w-full flex items-center justify-center space-x-1.5 bg-teal-500 text-white font-semibold py-2 px-2 rounded-md hover:bg-teal-600 transition-colors duration-200 disabled:bg-gray-300 text-xs"
                          >
                              <DownloadIcon className="w-4 h-4" /><span>기본 저장</span>
                          </button>
                          <button
                              onClick={() => handleDownloadCSV(true)}
                              disabled={history.length === 0 && waitingList.length === 0 && slots.every(s => s.participantName === null)}
                              className="w-full flex items-center justify-center space-x-1.5 bg-teal-600 text-white font-semibold py-2 px-2 rounded-md hover:bg-teal-700 transition-colors duration-200 disabled:bg-gray-300 text-xs"
                          >
                              <EditIcon className="w-4 h-4" /><span>다른 이름으로 저장</span>
                          </button>
                      </div>
                  </div>

                  <div className="p-3 rounded-lg border border-gray-200 bg-slate-50">
                      <p className="text-sm font-medium text-gray-700 mb-2 text-center">백업 (JSON)</p>
                      <div className="grid grid-cols-2 gap-2">
                          <button
                              onClick={() => handleBackupJSON(false)}
                              className="w-full flex items-center justify-center space-x-1.5 bg-sky-600 text-white font-semibold py-2 px-2 rounded-md hover:bg-sky-700 transition-colors duration-200 text-xs"
                          >
                              <DownloadIcon className="w-4 h-4" /><span>기본 저장</span>
                          </button>
                          <button
                              onClick={() => handleBackupJSON(true)}
                              className="w-full flex items-center justify-center space-x-1.5 bg-sky-700 text-white font-semibold py-2 px-2 rounded-md hover:bg-sky-800 transition-colors duration-200 text-xs"
                          >
                              <EditIcon className="w-4 h-4" /><span>다른 이름으로 저장</span>
                          </button>
                      </div>
                  </div>

                  <button
                      onClick={handleRestoreClick}
                      className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                      <UploadIcon className="w-5 h-5" /><span>데이터 복구</span>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                  >
                    <ClockIcon className="w-5 h-5" /><span>{showHistory ? '이력 숨기기' : '이력 보기'}</span>
                  </button>
                   <button
                    onClick={handleSystemReset}
                    className="w-full flex items-center justify-center space-x-2 bg-amber-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-amber-600 transition-colors duration-200"
                  >
                    <RefreshIcon className="w-5 h-5" /><span>시스템 초기화</span>
                  </button>
                </div>
              </section>
            </div>
          </main>
          
          {/* 번호 관리 */}
          <section className="bg-white p-6 rounded-xl shadow-lg mt-8">
            <h2 className="flex items-center text-xl font-bold text-gray-800 mb-4">
              <EditIcon className="w-6 h-6 mr-2 text-indigo-500"/>
              번호 관리
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="slot-select" className="block text-sm font-medium text-gray-700">자리 번호:</label>
                <select
                  id="slot-select"
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">선택하세요</option>
                  {slots.map((slot, index) => (
                    <option key={slot.id} value={slot.id}>
                      {index + 1}번 자리 {slot.participantName ? `(${slot.participantName})` : '(비어있음)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="participant-name" className="block text-sm font-medium text-gray-700">체험자 이름:</label>
                <input
                  type="text"
                  id="participant-name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  disabled={isSlotOccupied}
                  placeholder="이름을 입력하세요"
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="memo" className="block text-sm font-medium text-gray-700">메모 (선택사항):</label>
                <input
                  type="text"
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  disabled={isSlotOccupied}
                  placeholder="추가 정보"
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md disabled:bg-gray-100"
                />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleStartExperience}
                disabled={!selectedSlotId || isSlotOccupied || !participantName.trim()}
                className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <PlayIcon className="w-5 h-5"/><span>체험 시작</span>
              </button>
              <button
                onClick={() => handleEndExperience(parseInt(selectedSlotId, 10))}
                disabled={!selectedSlotId || !isSlotOccupied}
                className="w-full flex items-center justify-center space-x-2 bg-yellow-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-yellow-600 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <StopIcon className="w-5 h-5"/><span>체험 종료</span>
              </button>
            </div>
          </section>

          {showHistory && <HistoryTable history={history} />}
          
          <StartExperienceModal 
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onConfirm={handleConfirmStart}
            slotNumber={modalSlotId !== null ? modalSlotId + 1 : 0}
          />

          <AdmitWaiterModal
            isOpen={isAdmitModalOpen}
            onClose={handleCloseAdmitModal}
            onConfirm={handleConfirmAdmitWaiter}
            waiter={waitingList.length > 0 ? waitingList[0] : null}
            slotNumber={modalSlotId !== null ? modalSlotId + 1 : 0}
          />
        </div>
      </div>
    </>
  );
}

export default App;