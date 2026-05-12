/**
 * Bridge to the native Kotlin LuminaUsageStatsModule.
 * Registered via LuminaUsageStatsPackage in MainApplication.kt.
 */
import { NativeModules } from 'react-native';

const { LuminaUsageStats: NativeLuminaUsageStats, LuminaBlocking: NativeLuminaBlocking } =
  NativeModules;

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

/**
 * Bridge to LuminaBlockingModule (LuminaBlockingPackage).
 *
 * Manages the foreground polling service that detects blocked apps in the
 * foreground and launches LuminaBlockedOverlayActivity on top of them.
 *
 * Blocked apps + dailyLimitSeconds stored in SharedPreferences on the native side.
 */
export const LuminaBlocking = {
  startService: (): Promise<void> =>
    NativeLuminaBlocking.startService(),

  stopService: (): Promise<void> =>
    NativeLuminaBlocking.stopService(),

  registerBlockedApp: (bundleId: string, dailyLimitSeconds: number): Promise<void> =>
    NativeLuminaBlocking.registerBlockedApp(bundleId, dailyLimitSeconds),

  unregisterBlockedApp: (bundleId: string): Promise<void> =>
    NativeLuminaBlocking.unregisterBlockedApp(bundleId),

  getBlockedApps: (): Promise<string> =>
    NativeLuminaBlocking.getBlockedApps(),
};
