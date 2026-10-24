import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import type { SocialPost } from '../types';

/**
 * LinkUp plans are stored with the existing feed API.
 *
 * The backend exposes a fixed post category enum (general, rent, buddy, college,
 * event, question, discussion) and only lets a post carry a title and free-form
 * content. There is no plan/event table, no join table and no plan endpoint, and
 * the backend must not be changed. So a plan is published as an `event` post:
 * the title holds the plan name and the content starts with a small, fixed
 * header block that this module writes and reads back.
 */

export const PLAN_CATEGORY = 'event';

export const PLAN_MAX_TITLE = 120;
export const PLAN_MAX_DESCRIPTION = 1000;
export const PLAN_MIN_PARTICIPANTS = 2;
export const PLAN_MAX_PARTICIPANTS = 50;

export interface PlanActivity {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
}

export const PLAN_ACTIVITIES: PlanActivity[] = [
  { id: 'walking', label: 'Walking', emoji: '🚶', gradient: 'from-sage-500 to-emerald-600' },
  { id: 'trekking', label: 'Trekking', emoji: '🥾', gradient: 'from-emerald-600 to-teal-700' },
  { id: 'gym', label: 'Gym', emoji: '🏋️', gradient: 'from-coral-500 to-rose-600' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮', gradient: 'from-navy-500 to-indigo-600' },
  { id: 'evening-walk', label: 'Evening Walk', emoji: '🌇', gradient: 'from-amber-500 to-orange-600' },
  { id: 'casual-chat', label: 'Casual Chat', emoji: '☕', gradient: 'from-accent-500 to-coral-500' },
  { id: 'other', label: 'Other', emoji: '✨', gradient: 'from-navy-600 to-navy-800' },
];

const FALLBACK_ACTIVITY: PlanActivity = {
  id: 'other',
  label: 'Other',
  emoji: '✨',
  gradient: 'from-navy-600 to-navy-800',
};

export function getPlanActivity(label: string): PlanActivity {
  const normalized = label.trim().toLowerCase();
  return PLAN_ACTIVITIES.find((activity) => activity.label.toLowerCase() === normalized) || {
    ...FALLBACK_ACTIVITY,
    label: label.trim() || FALLBACK_ACTIVITY.label,
  };
}

export interface PlanDetails {
  activity: PlanActivity;
  startsAt: Date;
  capacity: number;
  description: string;
  isPast: boolean;
}

const PLAN_CONTENT_PATTERN =
  /^Activity: ([^\n]+)\nWhen: (\d{4}-\d{2}-\d{2}T\d{2}:\d{2})\nMax participants: (\d+)\n\n([\s\S]*)$/;

/** Combines a date input value (YYYY-MM-DD) and a time input value (HH:mm) into a local ISO string. */
export function combinePlanDateTime(date: string, time: string): string | null {
  if (!date || !time) return null;
  const value = `${date}T${time}`;
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) return null;
  // Reject out-of-range values such as 2026-02-31 that parseISO might normalise.
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hours ||
    parsed.getMinutes() !== minutes
  ) {
    return null;
  }
  return value;
}

export function buildPlanContent(input: {
  activityLabel: string;
  startsAt: string;
  capacity: number;
  description: string;
}): string {
  return [
    `Activity: ${input.activityLabel}`,
    `When: ${input.startsAt}`,
    `Max participants: ${input.capacity}`,
    '',
    input.description.trim(),
  ].join('\n');
}

/** Returns the plan stored in a feed post, or null when the post is not a LinkUp plan. */
export function parsePlan(post: Pick<SocialPost, 'category' | 'content'>): PlanDetails | null {
  if (post.category !== PLAN_CATEGORY) return null;
  const match = PLAN_CONTENT_PATTERN.exec(post.content || '');
  if (!match) return null;

  const startsAt = parseISO(match[2]);
  if (Number.isNaN(startsAt.getTime())) return null;

  return {
    activity: getPlanActivity(match[1]),
    startsAt,
    capacity: Number(match[3]),
    description: match[4].trim(),
    isPast: startsAt.getTime() < Date.now(),
  };
}

export function formatPlanDateTime(date: Date): string {
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`;
  return format(date, 'EEE, d MMM · h:mm a');
}

export interface PlanFormValues {
  activityLabel: string;
  title: string;
  date: string;
  time: string;
  description: string;
  capacity: string;
}

/** Returns a user-facing error message, or null when the form can be submitted. */
export function validatePlanForm(values: PlanFormValues): string | null {
  const activity = getPlanActivity(values.activityLabel);
  if (!PLAN_ACTIVITIES.some((item) => item.label === activity.label)) {
    return 'Pick an activity for your plan.';
  }
  if (!values.title.trim()) {
    return 'Give your plan a title.';
  }
  if (values.title.trim().length > PLAN_MAX_TITLE) {
    return `Keep the title under ${PLAN_MAX_TITLE} characters.`;
  }
  if (!values.date || !values.time) {
    return 'Choose the date and time of your plan.';
  }
  const startsAt = combinePlanDateTime(values.date, values.time);
  if (!startsAt) {
    return 'That date and time looks invalid.';
  }
  if (parseISO(startsAt).getTime() < Date.now()) {
    return 'Pick a date and time in the future.';
  }
  if (!values.description.trim()) {
    return 'Add a short description so people know what to expect.';
  }
  if (values.description.trim().length > PLAN_MAX_DESCRIPTION) {
    return `Keep the description under ${PLAN_MAX_DESCRIPTION} characters.`;
  }
  const capacity = Number(values.capacity);
  if (
    !Number.isInteger(capacity) ||
    capacity < PLAN_MIN_PARTICIPANTS ||
    capacity > PLAN_MAX_PARTICIPANTS
  ) {
    return `Set the number of participants between ${PLAN_MIN_PARTICIPANTS} and ${PLAN_MAX_PARTICIPANTS}.`;
  }
  return null;
}
