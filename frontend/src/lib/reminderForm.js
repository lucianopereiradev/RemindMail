import { utcToWallTime } from "./datetime.js";

export const EMPTY_REMINDER = {
  title: "",
  description: "",
  when: "",
  notify_before_minutes: 0,
  recurrence: "none",
  recurrence_days: [],
};

export function reminderToForm(r, tz) {
  return {
    title: r.title,
    description: r.description ?? "",
    when: utcToWallTime(r.remind_at, tz),
    notify_before_minutes: r.notify_before_minutes,
    recurrence: r.recurrence,
    recurrence_days: r.recurrence_days ?? [],
  };
}
