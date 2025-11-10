import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CalendarEvent, CalendarFilter } from '../types';

interface CalendarState {
  events: CalendarEvent[];
  view: 'month' | 'week' | 'day' | 'list';
  selectedDate: Date;
  filter: CalendarFilter;

  // Actions
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  setView: (view: CalendarState['view']) => void;
  setSelectedDate: (date: Date) => void;
  setFilter: (filter: CalendarFilter) => void;
  clearFilter: () => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsInRange: (start: Date, end: Date) => CalendarEvent[];
  reset: () => void;
}

const initialState = {
  events: [],
  view: 'month' as const,
  selectedDate: new Date(),
  filter: {} as CalendarFilter,
};

export const useCalendarStore = create<CalendarState>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      addEvent: (event) =>
        set((state) => {
          // Check if event already exists
          const exists = state.events.some((e) => e.id === event.id);
          if (!exists) {
            state.events.push(event);
          }
        }),

      updateEvent: (id, updates) =>
        set((state) => {
          const event = state.events.find((e) => e.id === id);
          if (event) {
            Object.assign(event, updates);
          }
        }),

      deleteEvent: (id) =>
        set((state) => {
          state.events = state.events.filter((e) => e.id !== id);
        }),

      setView: (view) =>
        set((state) => {
          state.view = view;
        }),

      setSelectedDate: (date) =>
        set((state) => {
          state.selectedDate = date;
        }),

      setFilter: (filter) =>
        set((state) => {
          state.filter = filter;
        }),

      clearFilter: () =>
        set((state) => {
          state.filter = {};
        }),

      getEventsForDate: (date) => {
        const events = get().events;
        return events.filter((event) => {
          const eventDate = new Date(event.date);
          return (
            eventDate.getFullYear() === date.getFullYear() &&
            eventDate.getMonth() === date.getMonth() &&
            eventDate.getDate() === date.getDate()
          );
        });
      },

      getEventsInRange: (start, end) => {
        const events = get().events;
        return events.filter((event) => {
          const eventDate = new Date(event.date);
          return eventDate >= start && eventDate <= end;
        });
      },

      reset: () => set(initialState),
    })),
    {
      name: 'wp-automator-calendar',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        events: state.events,
        view: state.view,
        filter: state.filter,
      }),
    }
  )
);

// Selectors
export const useFilteredEvents = () =>
  useCalendarStore((state) => {
    let filtered = [...state.events];

    if (state.filter.status && state.filter.status.length > 0) {
      filtered = filtered.filter((e) => state.filter.status!.includes(e.status));
    }

    if (state.filter.siteId && state.filter.siteId.length > 0) {
      filtered = filtered.filter((e) => state.filter.siteId!.includes(e.siteId));
    }

    if (state.filter.dateRange) {
      const { start, end } = state.filter.dateRange;
      filtered = filtered.filter((e) => {
        const eventDate = new Date(e.date);
        return eventDate >= start && eventDate <= end;
      });
    }

    return filtered;
  });
