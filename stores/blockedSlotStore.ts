import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlockedSlot, BlockedRepeat } from '@/types';

const KEY = '@surgo_blocked_slots';
const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

interface BlockedSlotStore {
  slots: BlockedSlot[];
  isLoaded: boolean;
  load: () => Promise<void>;
  addSlot: (s: Omit<BlockedSlot, 'id'>) => Promise<void>;
  removeSlot: (id: string) => Promise<void>;
  /** Returns slots that apply on a given JS day-of-week (0=Sun … 6=Sat) */
  getSlotsForDay: (dow: number) => BlockedSlot[];
}

async function persist(data: BlockedSlot[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export const useBlockedSlotStore = create<BlockedSlotStore>((set, get) => ({
  slots: [],
  isLoaded: false,

  load: async () => {
    const raw = await AsyncStorage.getItem(KEY);
    set({ slots: raw ? JSON.parse(raw) : [], isLoaded: true });
  },

  addSlot: async (data) => {
    const slot: BlockedSlot = { ...data, id: uuid() };
    const slots = [...get().slots, slot];
    set({ slots });
    await persist(slots);
  },

  removeSlot: async (id) => {
    const slots = get().slots.filter(s => s.id !== id);
    set({ slots });
    await persist(slots);
  },

  getSlotsForDay: (dow) => {
    return get().slots.filter(s => {
      if (s.repeat === 'daily')    return true;
      if (s.repeat === 'weekdays') return dow >= 1 && dow <= 5;
      if (s.repeat === 'weekends') return dow === 0 || dow === 6;
      return false;
    });
  },
}));
