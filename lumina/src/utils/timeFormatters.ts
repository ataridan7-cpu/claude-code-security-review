export function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export function formatHours(seconds: number): string {
  return (seconds / 3600).toFixed(1) + 'h';
}

export function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function dateRangeStrings(daysBack: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - daysBack);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}
