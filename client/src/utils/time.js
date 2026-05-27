export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // Sunday = day 0
  return d.toISOString().split('T')[0];
}

export function dayProgress(date = new Date()) {
  const seconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return seconds / 86400;
}

export function weekProgress(date = new Date()) {
  const day = date.getDay();
  const dayIndex = day === 0 ? 6 : day - 1;
  const secondsIntoWeek = dayIndex * 86400 + date.getHours() * 3600 +
    date.getMinutes() * 60 + date.getSeconds();
  return secondsIntoWeek / (7 * 86400);
}

export function formatTime(date = new Date()) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDateLabel(date = new Date()) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function computeStreak(ratings) {
  if (!ratings.length) return 0;

  let streak = 0;
  let cursor = new Date();
  const currentWeekStart = getWeekStart(cursor);
  const ratedWeeks = new Set(ratings.map(r => r.week_start));

  let weekStart = currentWeekStart;
  while (ratedWeeks.has(weekStart)) {
    streak++;
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    weekStart = d.toISOString().split('T')[0];
  }

  return streak;
}
