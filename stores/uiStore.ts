import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type AppState = 'SiteSelection' | 'Connecting' | 'Dashboard' | 'Error';

interface UIState {
  theme: Theme;
  appState: AppState;
  isAddingSite: boolean;
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setAppState: (state: AppState) => void;
  setIsAddingSite: (isAdding: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      appState: 'SiteSelection',
      isAddingSite: false,
      sidebarOpen: true,
      commandPaletteOpen: false,

      setTheme: (theme) => set({ theme }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      setAppState: (appState) => set({ appState }),

      setIsAddingSite: (isAddingSite) => set({ isAddingSite }),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),

      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),

      toggleCommandPalette: () =>
        set((state) => ({
          commandPaletteOpen: !state.commandPaletteOpen,
        })),
    }),
    {
      name: 'wp-automator-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
