import Foundation
import FamilyControls
import DeviceActivity
import ManagedSettings

/// RN native module — reads aggregated screen time from the shared App Group
/// UserDefaults written by the DeviceActivityMonitor extension.
///
/// App Group: group.com.lumina.app
/// Extension: DeviceActivityExtension/DeviceActivityMonitor.swift
@objc(LuminaScreenTime)
class LuminaScreenTime: NSObject {

  private let appGroupId = "group.com.lumina.app"
  private let center = AuthorizationCenter.shared

  @objc func requestPermission(_ resolve: @escaping RCTPromiseResolveBlock,
                                rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        try await center.requestAuthorization(for: .individual)
        resolve("granted")
      } catch {
        resolve("denied")
      }
    }
  }

  @objc func hasPermission(_ resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
    let status = center.authorizationStatus
    resolve(status == .approved)
  }

  @objc func getTodayUsage(_ resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
    let today = ISO8601DateFormatter().string(from: Date()).prefix(10)
    resolve(readUsageRecords(forDate: String(today)))
  }

  @objc func getUsageForRange(_ startMs: Double,
                               endMs: Double,
                               resolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
    var records: [[String: Any]] = []
    let start = Date(timeIntervalSince1970: startMs / 1000)
    let end   = Date(timeIntervalSince1970: endMs / 1000)

    var current = start
    let calendar = Calendar.current
    while current <= end {
      let dateStr = ISO8601DateFormatter().string(from: current).prefix(10)
      records.append(contentsOf: readUsageRecords(forDate: String(dateStr)))
      current = calendar.date(byAdding: .day, value: 1, to: current) ?? end.addingTimeInterval(1)
    }
    resolve(records)
  }

  @objc func getPickUpCount(_ resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
    let defaults = UserDefaults(suiteName: appGroupId)
    let count = defaults?.integer(forKey: "lumina_pickups_today") ?? 0
    resolve(count)
  }

  // MARK: – Private helpers

  private func readUsageRecords(forDate date: String) -> [[String: Any]] {
    guard let defaults = UserDefaults(suiteName: appGroupId),
          let data = defaults.data(forKey: "lumina_usage_\(date)"),
          let records = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
    else { return [] }
    return records
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }
}
