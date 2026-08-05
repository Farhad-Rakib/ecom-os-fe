import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type TableDensity = 'compact' | 'normal' | 'comfortable';

interface PreferencesState {
  tableDensity: TableDensity;
  sidebarCollapsed: boolean;
  setTableDensity: (d: TableDensity) => void;
  setSidebarCollapsed: (c: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      tableDensity: 'normal',
      sidebarCollapsed: false,
      setTableDensity: (tableDensity) => set({ tableDensity }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    { name: 'admin_preferences' }
  )
);
