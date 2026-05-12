import { create } from 'zustand';
import { AppUsageRecord, DailyScreenTimeSummary } from '../models';

interface ScreenTimeState {
  todaySummary: DailyScreenTimeSummary | null;
  weekSummaries: DailyScreenTimeSummary[];
  rawRecords: AppUsageRecord[];
  lastSyncedAt: number | null;
  isLoading: boolean;
  error: string | null;

  setTodaySummary: (summary: DailyScreenTimeSummary) => void;
  setWeekSummaries: (summaries: DailyScreenTimeSummary[]) => void;
  setRawRecords: (records: AppUsageRecord[]) => void;
  setLastSyncedAt: (ts: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useScreenTimeStore = create<ScreenTimeState>((set) => ({
  todaySummary: null,
  weekSummaries: [],
  rawRecords: [],
  lastSyncedAt: null,
  isLoading: false,
  error: null,

  setTodaySummary: (summary) => set({ todaySummary: summary }),
  setWeekSummaries: (summaries) => set({ weekSummaries: summaries }),
  setRawRecords: (records) => set({ rawRecords: records }),
  setLastSyncedAt: (ts) => set({ lastSyncedAt: ts }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
