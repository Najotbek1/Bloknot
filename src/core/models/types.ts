/** A calendar date in local time, formatted `YYYY-MM-DD`. */
export type DateKey = string
/** A calendar month, formatted `YYYY-MM`. */
export type MonthKey = string
/** A time of day, formatted `HH:mm`. */
export type TimeOfDay = string

/**
 * Fields shared by every stored record. Timestamps are epoch milliseconds.
 * Records are never removed: `deletedAt` marks them deleted so that export/import
 * can merge two devices by keeping the most recently updated copy.
 */
export interface BaseRecord {
  id: string
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export type TaskKind = 'daily' | 'weekly' | 'monthly' | 'range' | 'general'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'skipped'
export type TaskPriority = 'low' | 'normal' | 'high'

/** 1 = Monday … 7 = Sunday (ISO weekday). */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface RecurrenceRule {
  freq: 'daily' | 'weekly' | 'monthly'
  /** Repeat every `interval` days / weeks / months. At least 1. */
  interval: number
  /** For `weekly`: which weekdays. Defaults to the anchor date's weekday. */
  weekdays?: readonly Weekday[]
  /** For `monthly`: day of month (1–31). Months without that day are skipped. Defaults to the anchor's day. */
  monthDay?: number
  /** Last date (inclusive) the task can occur on. */
  until?: DateKey
}

export interface Reminder {
  time: TimeOfDay
  /** How many days before the task's date to remind. 0 = on the day. */
  daysBefore: number
}

export interface Task extends BaseRecord {
  title: string
  notes: string
  kind: TaskKind
  status: TaskStatus
  priority: TaskPriority
  /** `daily`: the day. For a recurring task, the first day it occurs (anchor). */
  date: DateKey | null
  /** `weekly`: Monday of the week. */
  weekStart: DateKey | null
  /** `monthly`: the month. */
  month: MonthKey | null
  /** `range`: first and last day (inclusive). */
  startDate: DateKey | null
  endDate: DateKey | null
  reminders: Reminder[]
  /** Only used for `daily` tasks; `date` is the anchor. */
  recurrence: RecurrenceRule | null
  completedAt: number | null
  notebookId: string | null
  /** Manual sort position within a list. */
  order: number
}

/** The status of one day of a recurring task. Missing record = `todo`. */
export interface TaskOccurrence extends BaseRecord {
  taskId: string
  date: DateKey
  status: TaskStatus
  completedAt: number | null
}

export interface Notebook extends BaseRecord {
  title: string
  color: string
  order: number
}

export interface Note extends BaseRecord {
  notebookId: string
  title: string
  body: string
  taskId: string | null
}

/** How a day reminder rings: three times that day (09:00, 14:00, 20:00), or once at `time`. */
export type DayReminderMode = 'thrice' | 'time'

/** A note-to-self pinned to a calendar day, delivered as notifications on that day. */
export interface DayReminder extends BaseRecord {
  date: DateKey
  text: string
  mode: DayReminderMode
  /** Set when `mode` is 'time'. */
  time: TimeOfDay | null
}

/** "system" follows the phone (light or dark); the others are fixed palettes from theme.css. */
export type ThemePreference = 'system' | 'light' | 'dark' | 'black' | 'pink' | 'amber'
/** How the Calendar tab shows plans: a month grid, or the older lists by day/week/month. */
export type PlanView = 'calendar' | 'list'
export type Language = 'uz'

export interface Settings extends BaseRecord {
  id: 'settings'
  theme: ThemePreference
  planView: PlanView
  /** Notification wording follows the 7-day responsibility score (src/core/coach.ts). */
  coachMode: boolean
  /** Morning notification listing the day's tasks. */
  morningSummary: boolean
  morningSummaryTime: TimeOfDay
  /** Evening notification saying how many of the day's tasks are left. */
  eveningSummary: boolean
  eveningSummaryTime: TimeOfDay
  /** Warn the day before and on the last day of a range task, at the morning time. */
  deadlineWarnings: boolean
  language: Language
}

/** Fields the caller provides when creating a record; the rest are filled in. */
export type NewRecord<T extends BaseRecord> = Omit<T, keyof BaseRecord> & { id?: string }
