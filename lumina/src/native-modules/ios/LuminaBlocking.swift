import Foundation
import FamilyControls
import DeviceActivity
import ManagedSettings
import UIKit

/// RN native module — iOS app-limit enforcement using FamilyControls + ManagedSettings.
///
/// Flow:
///   1. presentAppPicker()  → user picks apps via FamilyActivityPicker
///   2. registerLimitForSelection()  → starts DeviceActivity monitoring with daily threshold
///   3. DeviceActivityMonitor extension calls shieldAppsForGoal() when threshold is hit
///   4. removeLimitForGoal()  → stops monitoring and removes shield when goal is paused
@objc(LuminaBlocking)
class LuminaBlocking: NSObject {

  private let appGroupId = "group.com.lumina.app"
  private let store = ManagedSettingsStore()
  private let activityCenter = DeviceActivityCenter()

  // MARK: – App Picker

  /// Presents the system FamilyActivityPicker so the user can choose apps to limit.
  /// Resolves with a base64-encoded FamilyActivitySelection, or null if cancelled.
  @objc func presentAppPicker(_ resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
            let rootVC = scene.windows.first?.rootViewController else {
        reject("NO_VC", "No root view controller found", nil)
        return
      }

      let picker = LuminaAppPickerViewController { selection in
        guard let selection = selection else {
          resolve(nil) // user cancelled
          return
        }
        if let data = try? JSONEncoder().encode(selection) {
          resolve(data.base64EncodedString())
        } else {
          reject("ENCODE_ERROR", "Failed to encode app selection", nil)
        }
      }
      rootVC.present(picker, animated: true)
    }
  }

  // MARK: – Register daily limit

  /// Stores the selection in the App Group and starts DeviceActivity monitoring.
  /// The DeviceActivityMonitor extension will call back when the threshold is hit.
  @objc func registerLimitForSelection(_ selectionData: String,
                                        goalId: String,
                                        dailyLimitSeconds: Double,
                                        resolver resolve: @escaping RCTPromiseResolveBlock,
                                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let data = Data(base64Encoded: selectionData),
          let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) else {
      reject("DECODE_ERROR", "Invalid selection data", nil)
      return
    }

    // Persist selection in shared App Group so the extension can read it
    let defaults = UserDefaults(suiteName: appGroupId)
    defaults?.set(selectionData, forKey: "lumina_selection_\(goalId)")
    defaults?.synchronize()

    // Build a daily schedule (midnight → 23:59, repeating)
    let schedule = DeviceActivitySchedule(
      intervalStart: DateComponents(hour: 0, minute: 0),
      intervalEnd: DateComponents(hour: 23, minute: 59),
      repeats: true
    )

    let threshold = DateComponents(second: Int(dailyLimitSeconds))
    let event = DeviceActivityEvent(
      applications: selection.applicationTokens,
      threshold: threshold
    )

    let activityName = DeviceActivityName("lumina.goal.\(goalId)")
    let eventName = DeviceActivityEvent.Name("lumina.limit.\(goalId)")

    do {
      try activityCenter.startMonitoring(activityName, during: schedule, events: [eventName: event])
      resolve(nil)
    } catch {
      reject("MONITOR_ERROR", error.localizedDescription, error)
    }
  }

  // MARK: – Remove limit

  @objc func removeLimitForGoal(_ goalId: String,
                                 resolver resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
    let activityName = DeviceActivityName("lumina.goal.\(goalId)")
    activityCenter.stopMonitoring([activityName])

    let defaults = UserDefaults(suiteName: appGroupId)
    defaults?.removeObject(forKey: "lumina_selection_\(goalId)")
    defaults?.synchronize()

    // Remove the shield only if no other selection remains active
    let allKeys = defaults?.dictionaryRepresentation().keys ?? [].makeIterator() as! Dictionary<String, Any>.Keys
    let hasOtherGoals = allKeys.contains { $0.hasPrefix("lumina_selection_") }
    if !hasOtherGoals {
      store.shield.applications = nil
    }
    resolve(nil)
  }

  // MARK: – Direct shield control (called by the extension via shared prefs or by JS)

  @objc func shieldAppsForGoal(_ goalId: String,
                                resolver resolve: @escaping RCTPromiseResolveBlock,
                                rejecter reject: @escaping RCTPromiseRejectBlock) {
    let defaults = UserDefaults(suiteName: appGroupId)
    guard let selectionData = defaults?.string(forKey: "lumina_selection_\(goalId)"),
          let data = Data(base64Encoded: selectionData),
          let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) else {
      reject("NOT_FOUND", "No selection found for goal \(goalId)", nil)
      return
    }
    store.shield.applications = selection.applicationTokens
    resolve(nil)
  }

  @objc func removeShield(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    store.shield.applications = nil
    resolve(nil)
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }
}
