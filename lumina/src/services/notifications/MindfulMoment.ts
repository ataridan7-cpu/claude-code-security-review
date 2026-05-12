import { AppState, AppStateStatus } from 'react-native';
import { ScreenTimeService } from '../screentime/ScreenTimeService';
import { detectDoomScrollSession } from '../../analytics/PatternAnalyzer';
import { NotificationService } from './NotificationService';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // check every 5 minutes
const COOLDOWN_MS = 60 * 60 * 1000;     // max one mindful moment per hour per app
const RECENT_WINDOW_MS = 6 * 60 * 1000; // session must have ended within last 6 min (covers one poll cycle)

let intervalId: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
const lastFiredAt: Record<string, number> = {};

async function check(): Promise<void> {
  try {
    const records = await ScreenTimeService.getTodayUsage();
    const now = Date.now();

    for (const record of records) {
      // Only consider sessions that are currently active or just ended
      if (record.sessionEnd < now - RECENT_WINDOW_MS) continue;

      // Respect per-app cooldown
      const last = lastFiredAt[record.bundleId] ?? 0;
      if (now - last < COOLDOWN_MS) continue;

      const continuousMinutes = record.durationSeconds / 60;
      if (detectDoomScrollSession(record.bundleId, record.categoryId, continuousMinutes)) {
        await NotificationService.fireMindfulMoment(record.appName);
        lastFiredAt[record.bundleId] = now;
        // Only fire one notification per check cycle
        break;
      }
    }
  } catch {
    // Silent — screen time data may be unavailable in dev/Expo Go
  }
}

export const MindfulMoment = {
  start(): void {
    if (intervalId) return;

    intervalId = setInterval(check, POLL_INTERVAL_MS);

    // Also run immediately when the app comes to the foreground
    appStateSubscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') check();
      }
    );
  },

  stop(): void {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    appStateSubscription?.remove();
    appStateSubscription = null;
  },
};
