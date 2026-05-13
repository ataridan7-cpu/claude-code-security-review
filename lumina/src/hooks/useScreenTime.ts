import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenTimeService } from '../services/screentime/ScreenTimeService';
import { insertRecords, getDailySummary, getLastNDaysSummaries } from '../services/storage/ScreenTimeRepository';

const QUERY_KEYS = {
  todaySummary: ['screentime', 'today'],
  weekSummaries: (n: number) => ['screentime', 'week', n],
};

export function useTodayScreenTime() {
  return useQuery({
    queryKey: QUERY_KEYS.todaySummary,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      // Sync fresh data from native module then read from DB
      const records = await ScreenTimeService.getTodayUsage();
      await insertRecords(records);
      return getDailySummary(today);
    },
    staleTime: 5 * 60 * 1000, // re-fetch every 5 min
    refetchOnWindowFocus: true,
  });
}

export function useWeekScreenTime(days = 7) {
  return useQuery({
    queryKey: QUERY_KEYS.weekSummaries(days),
    queryFn: () => getLastNDaysSummaries(days),
    staleTime: 15 * 60 * 1000,
  });
}

export function useSyncScreenTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const records = await ScreenTimeService.getTodayUsage();
      await insertRecords(records);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todaySummary });
    },
  });
}
