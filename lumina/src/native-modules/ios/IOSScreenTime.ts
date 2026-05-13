/**
 * Bridge to the native Swift LuminaScreenTime module.
 *
 * The native module is implemented in:
 *   src/native-modules/ios/LuminaScreenTime.swift
 *   src/native-modules/ios/LuminaScreenTimeModule.m  (RN bridge registration)
 *
 * It reads from the shared App Group UserDefaults written by the
 * DeviceActivityMonitor extension target.
 *
 * Requires:
 *   - com.apple.developer.family-controls entitlement (Apple approval needed)
 *   - com.apple.security.application-groups: ["group.com.lumina.app"]
 *   - Physical device (DeviceActivity not supported in Simulator)
 */
import { NativeModules } from 'react-native';

const { LuminaScreenTime: NativeLuminaScreenTime } = NativeModules;

export const LuminaScreenTime = {
  requestPermission: (): Promise<string> =>
    NativeLuminaScreenTime.requestPermission(),

  hasPermission: (): Promise<boolean> =>
    NativeLuminaScreenTime.hasPermission(),

  getTodayUsage: (): Promise<unknown[]> =>
    NativeLuminaScreenTime.getTodayUsage(),

  getUsageForRange: (startMs: number, endMs: number): Promise<unknown[]> =>
    NativeLuminaScreenTime.getUsageForRange(startMs, endMs),

  getPickUpCount: (): Promise<number> =>
    NativeLuminaScreenTime.getPickUpCount(),
};
