/**
 * Bridge to the native Kotlin LuminaUsageStatsModule.
 * Registered via LuminaUsageStatsPackage in MainApplication.kt.
 */
import { NativeModules } from 'react-native';

const { LuminaUsageStats: NativeLuminaUsageStats } = NativeModules;

export const LuminaUsageStats = {
  requestPermission: (): Promise<string> =>
    NativeLuminaUsageStats.requestPermission(),

  hasPermission: (): Promise<boolean> =>
    NativeLuminaUsageStats.hasPermission(),

  getTodayUsage: (): Promise<unknown[]> =>
    NativeLuminaUsageStats.getTodayUsage(),

  getUsageForRange: (startMs: number, endMs: number): Promise<unknown[]> =>
    NativeLuminaUsageStats.getUsageForRange(startMs, endMs),

  getPickUpCount: (): Promise<number> => Promise.resolve(0),
};
