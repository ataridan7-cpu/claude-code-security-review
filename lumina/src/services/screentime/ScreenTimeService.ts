import { Platform } from 'react-native';
import { AppUsageRecord, PermissionStatus } from '../../models';

// Native module interfaces — implemented per-platform
interface NativeScreenTimeModule {
  requestPermission(): Promise<string>;
  hasPermission(): Promise<boolean>;
  getTodayUsage(): Promise<AppUsageRecord[]>;
  getUsageForRange(startMs: number, endMs: number): Promise<AppUsageRecord[]>;
  getPickUpCount(): Promise<number>;
}

// Lazy-load native modules to avoid crashes in environments without the native build
function getNativeModule(): NativeScreenTimeModule {
  if (Platform.OS === 'ios') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LuminaScreenTime } = require('../../native-modules/ios/IOSScreenTime');
      return LuminaScreenTime;
    } catch {
      return MockScreenTimeModule;
    }
  }

  if (Platform.OS === 'android') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LuminaUsageStats } = require('../../native-modules/android/AndroidUsageStats');
      return LuminaUsageStats;
    } catch {
      return MockScreenTimeModule;
    }
  }

  return MockScreenTimeModule;
}

// ── Mock for development / Expo Go / web ──────────────────────────────────────

const MOCK_APPS = [
  { bundleId: 'com.instagram.ios', appName: 'Instagram', categoryId: 'social' as const },
  { bundleId: 'com.google.youtube', appName: 'YouTube', categoryId: 'entertainment' as const },
  { bundleId: 'com.apple.mobilesafari', appName: 'Safari', categoryId: 'productivity' as const },
  { bundleId: 'com.tiktok.TikTok', appName: 'TikTok', categoryId: 'social' as const },
  { bundleId: 'com.spotify.client', appName: 'Spotify', categoryId: 'entertainment' as const },
  { bundleId: 'com.notion.id', appName: 'Notion', categoryId: 'productivity' as const },
];

function generateMockRecord(app: (typeof MOCK_APPS)[number], date: string): AppUsageRecord {
  const durationSeconds = Math.floor(Math.random() * 3600) + 300;
  const sessionStart = new Date(date + 'T10:00:00').getTime() + Math.random() * 28800000;
  return {
    id: `mock-${app.bundleId}-${date}-${Math.random()}`,
    bundleId: app.bundleId,
    appName: app.appName,
    categoryId: app.categoryId,
    durationSeconds,
    sessionStart,
    sessionEnd: sessionStart + durationSeconds * 1000,
    date,
    platform: 'ios',
  };
}

const MockScreenTimeModule: NativeScreenTimeModule = {
  async requestPermission() {
    return 'granted';
  },
  async hasPermission() {
    return true;
  },
  async getTodayUsage() {
    const today = new Date().toISOString().split('T')[0];
    return MOCK_APPS.map((app) => generateMockRecord(app, today));
  },
  async getUsageForRange(startMs, endMs) {
    const records: AppUsageRecord[] = [];
    const start = new Date(startMs);
    const end = new Date(endMs);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0];
      records.push(...MOCK_APPS.map((app) => generateMockRecord(app, date)));
    }
    return records;
  },
  async getPickUpCount() {
    return Math.floor(Math.random() * 80) + 20;
  },
};

// ── Lazy-load blocking module (Android only) ──────────────────────────────────

function getBlockingModule() {
  if (Platform.OS !== 'android') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { LuminaBlocking } = require('../../native-modules/android/AndroidUsageStats');
    return LuminaBlocking;
  } catch {
    return null;
  }
}

// ── Public ScreenTimeService API ──────────────────────────────────────────────

export const ScreenTimeService = {
  async requestPermission(): Promise<PermissionStatus> {
    const native = getNativeModule();
    const result = await native.requestPermission();
    return result as PermissionStatus;
  },

  async hasPermission(): Promise<boolean> {
    return getNativeModule().hasPermission();
  },

  async getTodayUsage(): Promise<AppUsageRecord[]> {
    return getNativeModule().getTodayUsage();
  },

  async getUsageForRange(startDate: string, endDate: string): Promise<AppUsageRecord[]> {
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime() + 86399999; // end of day
    return getNativeModule().getUsageForRange(startMs, endMs);
  },

  async getPickUpCount(): Promise<number> {
    if (Platform.OS !== 'ios') return 0;
    return getNativeModule().getPickUpCount();
  },

  // ── App blocking (Android only) ────────────────────────────────────────────

  /**
   * Register a bundle ID with the Android blocking service.
   * Once registered, the service will overlay the app when it comes to the
   * foreground after the daily limit (dailyLimitSeconds) has been consumed.
   *
   * No-op on iOS — iOS enforcement is handled by the DeviceActivity extension.
   */
  async registerBlockedApp(bundleId: string, dailyLimitSeconds: number): Promise<void> {
    const blocking = getBlockingModule();
    if (!blocking) return;
    await blocking.registerBlockedApp(bundleId, dailyLimitSeconds);
  },

  /**
   * Remove a bundle ID from the Android blocking service.
   * Clears any active grace period for that app too.
   *
   * No-op on iOS.
   */
  async unregisterBlockedApp(bundleId: string): Promise<void> {
    const blocking = getBlockingModule();
    if (!blocking) return;
    await blocking.unregisterBlockedApp(bundleId);
  },

  /**
   * Start the foreground polling service.
   * Should be called once after the first goal with targetApps is activated.
   *
   * No-op on iOS.
   */
  async startBlockingService(): Promise<void> {
    const blocking = getBlockingModule();
    if (!blocking) return;
    await blocking.startService();
  },

  /**
   * Stop the foreground polling service.
   * Call when all app-limit goals are paused or deleted.
   *
   * No-op on iOS.
   */
  async stopBlockingService(): Promise<void> {
    const blocking = getBlockingModule();
    if (!blocking) return;
    await blocking.stopService();
  },
};
