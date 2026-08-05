import { create } from 'zustand';

export interface SiteSettingEntry {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
}

interface SiteSettingsState {
  siteTitle: string;
  logoUrl: string;
  tagline: string;
  settings: SiteSettingEntry[];
  setSiteTitle: (title: string) => void;
  setBranding: (branding: { title: string | null; logoUrl: string | null; tagline: string | null }) => void;
  setSettings: (settings: SiteSettingEntry[]) => void;
  getSettingValue: (key: string) => string | null;
}

export const useSiteSettingsStore = create<SiteSettingsState>()((set, get) => ({
  siteTitle: '',
  logoUrl: '',
  tagline: '',
  settings: [],
  setSiteTitle: (title) => {
    if (get().siteTitle !== title) {
      set({ siteTitle: title });
      if (title) document.title = title;
    }
  },
  setBranding: (branding) => {
    set({
      siteTitle: branding.title || get().siteTitle,
      logoUrl: branding.logoUrl || '',
      tagline: branding.tagline || '',
    });
    if (branding.title) document.title = branding.title;
  },
  setSettings: (settings) => {
    if (get().settings.length === settings.length && get().settings === settings) return;
    const titleSetting = settings.find(s => s.key === 'site_title' || s.key === 'SiteTitle' || s.key === 'siteTitle');
    const newTitle = titleSetting?.value || '';
    const updates: Partial<SiteSettingsState> = { settings };
    if (newTitle && newTitle !== get().siteTitle) {
      updates.siteTitle = newTitle;
      document.title = newTitle;
    }
    set(updates);
  },
  getSettingValue: (key: string) => {
    const s = get().settings.find(s => s.key === key);
    return s?.value || null;
  },
}));
