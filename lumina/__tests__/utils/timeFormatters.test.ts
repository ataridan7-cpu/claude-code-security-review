import {
  formatSeconds,
  formatHours,
  todayDateString,
  dateRangeStrings,
} from '../../src/utils/timeFormatters';

describe('formatSeconds', () => {
  it('shows seconds under a minute', () => {
    expect(formatSeconds(45)).toBe('45s');
  });

  it('shows minutes between 1–59 min', () => {
    expect(formatSeconds(90)).toBe('1m');
    expect(formatSeconds(3540)).toBe('59m');
  });

  it('shows hours with no remainder', () => {
    expect(formatSeconds(3600)).toBe('1h');
    expect(formatSeconds(7200)).toBe('2h');
  });

  it('shows hours and remaining minutes', () => {
    expect(formatSeconds(3660)).toBe('1h 1m');
    expect(formatSeconds(5400)).toBe('1h 30m');
  });

  it('handles zero', () => {
    expect(formatSeconds(0)).toBe('0s');
  });
});

describe('formatHours', () => {
  it('converts seconds to hours with one decimal', () => {
    expect(formatHours(3600)).toBe('1.0h');
    expect(formatHours(5400)).toBe('1.5h');
    expect(formatHours(0)).toBe('0.0h');
  });
});

describe('todayDateString', () => {
  it('returns a YYYY-MM-DD string matching today', () => {
    const result = todayDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toBe(new Date().toISOString().split('T')[0]);
  });
});

describe('dateRangeStrings', () => {
  it('returns start N days before end', () => {
    const { start, end } = dateRangeStrings(7);
    expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });

  it('end equals today', () => {
    const { end } = dateRangeStrings(3);
    expect(end).toBe(new Date().toISOString().split('T')[0]);
  });
});
