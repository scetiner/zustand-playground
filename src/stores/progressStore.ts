import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ProgressState {
  completedLessons: number[];
  markComplete: (lessonId: number) => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedLessons: [],

      markComplete: (lessonId: number) => {
        const { completedLessons } = get();
        if (!completedLessons.includes(lessonId)) {
          set({ completedLessons: [...completedLessons, lessonId] });
        }
      },

      resetProgress: () => {
        set({ completedLessons: [] });
      },
    }),
    {
      name: 'zustand-playground-progress',
      storage: createJSONStorage(() => localStorage),
      // Migration from old format
      migrate: (persistedState: unknown) => {
        const state = persistedState as { completedLessons?: unknown };
        // If completedLessons is not an array, reset it
        if (!Array.isArray(state?.completedLessons)) {
          return { completedLessons: [] };
        }
        return state as ProgressState;
      },
      version: 2,
    }
  )
);
