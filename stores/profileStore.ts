import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@surgo_profile';

export interface UserProfile {
  name: string;
  surgoName: string;   // custom Surgo nickname
  age: string;
  email: string;
  bio: string;
  photoUri: string;    // local image URI
}

const EMPTY: UserProfile = {
  name: '',
  surgoName: '',
  age: '',
  email: '',
  bio: '',
  photoUri: '',
};

interface ProfileStore {
  profile: UserProfile;
  isLoaded: boolean;
  load: () => Promise<void>;
  save: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: EMPTY,
  isLoaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      set({ profile: raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY, isLoaded: true });
    } catch {
      set({ profile: EMPTY, isLoaded: true });
    }
  },

  save: async (updates) => {
    const updated = { ...get().profile, ...updates };
    set({ profile: updated });
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  },
}));
