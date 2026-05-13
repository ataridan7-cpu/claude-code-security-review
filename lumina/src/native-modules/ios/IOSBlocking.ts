/**
 * Bridge to the native Swift LuminaBlocking module.
 *
 * Implemented in:
 *   src/native-modules/ios/LuminaBlocking.swift
 *   src/native-modules/ios/LuminaBlockingModule.m
 *   src/native-modules/ios/LuminaAppPickerViewController.swift
 *
 * Requires:
 *   - com.apple.developer.family-controls entitlement (Apple approval needed)
 *   - com.apple.security.application-groups: ["group.com.lumina.app"]
 *   - Physical device (FamilyControls not supported in Simulator)
 */
import { NativeModules } from 'react-native';

const { LuminaBlocking: NativeLuminaBlocking } = NativeModules;

export const LuminaBlocking = {
  /** Present the system FamilyActivityPicker. Returns base64-encoded selection or null if cancelled. */
  presentAppPicker: (): Promise<string | null> =>
    NativeLuminaBlocking.presentAppPicker(),

  /** Register a daily time limit for the given selection. Kicks off DeviceActivity monitoring. */
  registerLimitForSelection: (
    selectionData: string,
    goalId: string,
    dailyLimitSeconds: number
  ): Promise<void> =>
    NativeLuminaBlocking.registerLimitForSelection(selectionData, goalId, dailyLimitSeconds),

  /** Stop monitoring and clean up the selection for a goal. */
  removeLimitForGoal: (goalId: string): Promise<void> =>
    NativeLuminaBlocking.removeLimitForGoal(goalId),

  /** Immediately apply a ManagedSettings shield for a goal's stored selection. */
  shieldAppsForGoal: (goalId: string): Promise<void> =>
    NativeLuminaBlocking.shieldAppsForGoal(goalId),

  /** Remove all active shields. */
  removeShield: (): Promise<void> =>
    NativeLuminaBlocking.removeShield(),
};
