import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Site, WPCredentials, GeneratedPost } from '../types';

interface SitesState {
  sites: Site[];
  activeSiteId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  addSite: (site: Site) => void;
  removeSite: (siteId: string) => void;
  updateSite: (siteId: string, updates: Partial<Site>) => void;
  setActiveSite: (siteId: string | null) => void;
  updateSiteCredentials: (siteId: string, credentials: WPCredentials) => void;
  addGeneratedPost: (siteId: string, post: GeneratedPost) => void;
  updateGeneratedPost: (
    siteId: string,
    postTitle: string,
    updates: Partial<GeneratedPost>
  ) => void;
  removeGeneratedPost: (siteId: string, postTitle: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  sites: [],
  activeSiteId: null,
  isLoading: false,
  error: null,
};

export const useSitesStore = create<SitesState>()(
  persist(
    immer((set) => ({
      ...initialState,

      addSite: (site) =>
        set((state) => {
          // Check if site already exists
          const exists = state.sites.some((s) => s.id === site.id);
          if (!exists) {
            state.sites.push(site);
          }
        }),

      removeSite: (siteId) =>
        set((state) => {
          state.sites = state.sites.filter((s) => s.id !== siteId);
          if (state.activeSiteId === siteId) {
            state.activeSiteId = null;
          }
        }),

      updateSite: (siteId, updates) =>
        set((state) => {
          const site = state.sites.find((s) => s.id === siteId);
          if (site) {
            Object.assign(site, updates);
          }
        }),

      setActiveSite: (siteId) =>
        set((state) => {
          state.activeSiteId = siteId;
        }),

      updateSiteCredentials: (siteId, credentials) =>
        set((state) => {
          const site = state.sites.find((s) => s.id === siteId);
          if (site) {
            site.credentials = credentials;
          }
        }),

      addGeneratedPost: (siteId, post) =>
        set((state) => {
          const site = state.sites.find((s) => s.id === siteId);
          if (site) {
            // Check if post already exists
            const exists = site.generatedPosts.some((p) => p.title === post.title);
            if (!exists) {
              site.generatedPosts.push(post);
            }
          }
        }),

      updateGeneratedPost: (siteId, postTitle, updates) =>
        set((state) => {
          const site = state.sites.find((s) => s.id === siteId);
          if (site) {
            const post = site.generatedPosts.find((p) => p.title === postTitle);
            if (post) {
              Object.assign(post, updates);
            }
          }
        }),

      removeGeneratedPost: (siteId, postTitle) =>
        set((state) => {
          const site = state.sites.find((s) => s.id === siteId);
          if (site) {
            site.generatedPosts = site.generatedPosts.filter((p) => p.title !== postTitle);
          }
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      clearError: () =>
        set((state) => {
          state.error = null;
        }),

      reset: () => set(initialState),
    })),
    {
      name: 'wp-automator-sites',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sites: state.sites,
        activeSiteId: state.activeSiteId,
      }),
    }
  )
);

// Selectors
export const useActiveSite = () =>
  useSitesStore((state) => state.sites.find((s) => s.id === state.activeSiteId) ?? null);

export const useSiteById = (siteId: string | null) =>
  useSitesStore((state) => (siteId ? state.sites.find((s) => s.id === siteId) ?? null : null));
