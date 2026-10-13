import { create } from 'zustand'

export type SyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'offline' | 'error'
export const useSyncStatus = create<{ status: SyncStatus; set: (s: SyncStatus) => void }>((set) => ({
  status: 'idle',
  set: (status) => set({ status }),
}))
