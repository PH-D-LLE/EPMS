export interface Slot {
  id: number;
  participantName: string | null;
  memo: string | null;
  entryTime: Date | null;
}

export interface ParticipantHistory {
  id: string; // Unique ID for each entry
  slotNumber: number;
  participantName: string;
  memo: string | null;
  entryTime: Date;
  exitTime: Date | null;
}

export interface Waiter {
  id: string;
  name: string;
  phoneNumber: string;
  notified?: boolean;
  notifiedAt?: Date | null;
}

// Add types for File System Access API to avoid TypeScript errors
export interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string | string[]>;
}

export interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
}

export interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemWritableFileStream extends WritableStream {
  write(data: BlobPart): Promise<void>;
  close(): Promise<void>;
}

declare global {
  interface Window {
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  }
}
