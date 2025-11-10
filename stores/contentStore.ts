import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { SchedulingFrequency } from '../types';

interface ContentState {
  scheduling: SchedulingFrequency;
  isGenerating: boolean;
  generationProgress: number;
  lastGeneratedCount: number;

  // Actions
  setScheduling: (frequency: SchedulingFrequency) => void;
  setIsGenerating: (generating: boolean) => void;
  setGenerationProgress: (progress: number) => void;
  setLastGeneratedCount: (count: number) => void;
  incrementProgress: () => void;
  resetProgress: () => void;
}

export const useContentStore = create<ContentState>()(
  immer((set) => ({
    scheduling: SchedulingFrequency.OnClick,
    isGenerating: false,
    generationProgress: 0,
    lastGeneratedCount: 0,

    setScheduling: (scheduling) =>
      set((state) => {
        state.scheduling = scheduling;
      }),

    setIsGenerating: (isGenerating) =>
      set((state) => {
        state.isGenerating = isGenerating;
      }),

    setGenerationProgress: (generationProgress) =>
      set((state) => {
        state.generationProgress = Math.min(100, Math.max(0, generationProgress));
      }),

    setLastGeneratedCount: (lastGeneratedCount) =>
      set((state) => {
        state.lastGeneratedCount = lastGeneratedCount;
      }),

    incrementProgress: () =>
      set((state) => {
        state.generationProgress = Math.min(100, state.generationProgress + 1);
      }),

    resetProgress: () =>
      set((state) => {
        state.generationProgress = 0;
        state.isGenerating = false;
      }),
  }))
);
