import type { CalendarEvent, RecurrenceRule } from '../types';
import { useCalendarStore } from '../stores/calendarStore';
import { useSitesStore } from '../stores/sitesStore';
import * as wordpressService from './wordpressService';
import * as geminiService from '../services/geminiService';
import { generateId } from '../utils/helpers';

/**
 * Scheduler class for managing scheduled posts
 */
export class Scheduler {
  private queue: Map<string, CalendarEvent> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  /**
   * Initialize scheduler and restore queued events
   */
  initialize(): void {
    if (this.isInitialized) return;

    const { events } = useCalendarStore.getState();

    // Schedule all pending events
    events.forEach((event) => {
      if (event.status === 'scheduled') {
        this.schedulePost(event);
      }
    });

    this.isInitialized = true;
    console.log('Scheduler initialized with', this.queue.size, 'queued events');
  }

  /**
   * Schedules a post for publishing
   */
  schedulePost(event: CalendarEvent): void {
    this.queue.set(event.id, event);

    const now = new Date();
    const scheduledTime = new Date(event.date);
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      // Already past scheduled time, publish immediately
      this.publishPost(event);
      return;
    }

    // Schedule for future
    const timer = setTimeout(() => {
      this.publishPost(event);
    }, delay);

    this.timers.set(event.id, timer);

    console.log(
      `Post "${event.title}" scheduled for ${scheduledTime.toLocaleString('he-IL')}`
    );
  }

  /**
   * Cancels a scheduled post
   */
  cancelSchedule(eventId: string): void {
    const timer = this.timers.get(eventId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(eventId);
    }
    this.queue.delete(eventId);

    console.log(`Schedule cancelled for event ${eventId}`);
  }

  /**
   * Publishes a scheduled post
   */
  async publishPost(event: CalendarEvent): Promise<void> {
    try {
      // Update status to publishing
      useCalendarStore.getState().updateEvent(event.id, { status: 'publishing' });

      const site = useSitesStore.getState().sites.find((s) => s.id === event.siteId);
      if (!site) {
        throw new Error(`Site ${event.siteId} not found`);
      }

      // Generate full content if not exists
      if (!event.post.fullContent) {
        const fullContent = await geminiService.generateFullPostContent(event.post);
        event.post.fullContent = fullContent;
      }

      // Upload image if exists
      let mediaId: number | undefined;
      if (event.post.imageUrl) {
        const mediaItem = await wordpressService.uploadImage(
          site.credentials,
          event.post.imageUrl,
          event.post.title,
          event.post.imageSuggestion.altText
        );
        mediaId = mediaItem.id;
      }

      // Create post on WordPress
      await wordpressService.createPost(
        site.credentials,
        event.post,
        event.post.fullContent,
        mediaId
      );

      // Update event status
      useCalendarStore.getState().updateEvent(event.id, { status: 'published' });

      console.log(`Successfully published: "${event.title}"`);

      // Handle recurrence
      if (event.recurrence) {
        this.scheduleRecurrence(event);
      }
    } catch (error) {
      console.error('Failed to publish scheduled post:', error);

      useCalendarStore.getState().updateEvent(event.id, {
        status: 'failed',
        notes: `Publication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      this.queue.delete(event.id);
      this.timers.delete(event.id);
    }
  }

  /**
   * Schedules the next occurrence of a recurring event
   */
  private scheduleRecurrence(event: CalendarEvent): void {
    if (!event.recurrence) return;

    const nextDate = calculateNextDate(event.date, event.recurrence);

    if (!nextDate) {
      console.log(`Recurrence ended for "${event.title}"`);
      return;
    }

    // Create new event for next occurrence
    const newEvent: CalendarEvent = {
      ...event,
      id: generateId(),
      date: nextDate,
      status: 'scheduled',
    };

    useCalendarStore.getState().addEvent(newEvent);
    this.schedulePost(newEvent);

    console.log(`Next occurrence scheduled for ${nextDate.toLocaleString('he-IL')}`);
  }

  /**
   * Reschedules an event to a new date
   */
  reschedulePost(eventId: string, newDate: Date): void {
    this.cancelSchedule(eventId);

    const { events } = useCalendarStore.getState();
    const event = events.find((e) => e.id === eventId);

    if (event) {
      useCalendarStore.getState().updateEvent(eventId, {
        date: newDate,
        status: 'scheduled',
      });

      this.schedulePost({ ...event, date: newDate });
    }
  }

  /**
   * Gets queue status
   */
  getQueueStatus(): {
    totalQueued: number;
    scheduled: CalendarEvent[];
  } {
    return {
      totalQueued: this.queue.size,
      scheduled: Array.from(this.queue.values()),
    };
  }

  /**
   * Clears all scheduled events
   */
  clearQueue(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.queue.clear();
    console.log('Scheduler queue cleared');
  }

  /**
   * Destroys the scheduler
   */
  destroy(): void {
    this.clearQueue();
    this.isInitialized = false;
    console.log('Scheduler destroyed');
  }
}

/**
 * Calculates the next date for a recurring event
 */
export function calculateNextDate(
  currentDate: Date,
  recurrence: RecurrenceRule
): Date | null {
  const { frequency, interval, endDate } = recurrence;
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;

    case 'weekly':
      nextDate.setDate(nextDate.getDate() + interval * 7);
      break;

    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
  }

  // Check if we've reached the end
  if (endDate && nextDate > endDate) {
    return null;
  }

  // Count limit would need to be tracked separately in event metadata
  // For simplicity, we'll rely on endDate

  return nextDate;
}

/**
 * Creates a recurrence rule from simple frequency
 */
export function createRecurrenceRule(
  frequency: RecurrenceRule['frequency'],
  endDate?: Date
): RecurrenceRule {
  return {
    frequency,
    interval: 1,
    endDate,
  };
}

/**
 * Validates if a recurrence rule is valid
 */
export function isValidRecurrence(rule: RecurrenceRule): boolean {
  if (rule.interval < 1) return false;
  if (rule.endDate && rule.endDate < new Date()) return false;
  if (rule.count && rule.count < 1) return false;
  return true;
}

// Singleton instance
export const scheduler = new Scheduler();

// Auto-initialize on module load (only in browser)
if (typeof window !== 'undefined') {
  // Wait for stores to be ready
  setTimeout(() => {
    scheduler.initialize();
  }, 1000);
}
