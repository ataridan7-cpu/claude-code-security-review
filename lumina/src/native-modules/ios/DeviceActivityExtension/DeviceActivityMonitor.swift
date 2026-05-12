import DeviceActivity
import Foundation
import ManagedSettings

/// DeviceActivity extension — runs in a separate process.
/// Writes usage events to the shared App Group so the main app can read them.
///
/// Registered in Xcode as a DeviceActivityMonitor extension target.
/// App Group: group.com.lumina.app
class DeviceActivityMonitorExtension: DeviceActivityMonitor {

  private let appGroupId = "group.com.lumina.app"

  override func intervalDidStart(for activity: DeviceActivityName) {
    // New day / interval started — reset today's aggregated data
    let today = todayString()
    UserDefaults(suiteName: appGroupId)?.removeObject(forKey: "lumina_usage_\(today)")
  }

  override func intervalDidEnd(for activity: DeviceActivityName) {
    // Day ended — data is already accumulated, nothing to do
  }

  override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name,
                                        activity: DeviceActivityName) {
    // An app hit a configured threshold — post local notification via shared defaults
    guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
    defaults.set(event.rawValue, forKey: "lumina_threshold_reached_\(event.rawValue)")
    defaults.set(Date().timeIntervalSince1970, forKey: "lumina_threshold_time_\(event.rawValue)")
    defaults.synchronize()
  }

  /// Called by the system with updated usage data.
  /// Normalizes the DeviceActivityReport into the shared JSON format the main app expects.
  func writeUsageRecord(bundleId: String,
                         appName: String,
                         category: String,
                         durationSeconds: Int,
                         sessionStartMs: Int64,
                         sessionEndMs: Int64) {
    guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
    let today = todayString()
    let key = "lumina_usage_\(today)"

    var records: [[String: Any]] = []
    if let data = defaults.data(forKey: key),
       let existing = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
      records = existing
    }

    let record: [String: Any] = [
      "id": UUID().uuidString,
      "bundle_id": bundleId,
      "app_name": appName,
      "category": category,
      "duration_seconds": durationSeconds,
      "session_start": sessionStartMs,
      "session_end": sessionEndMs,
      "date": today,
      "platform": "ios",
    ]
    records.append(record)

    if let data = try? JSONSerialization.data(withJSONObject: records) {
      defaults.set(data, forKey: key)
      defaults.synchronize()
    }
  }

  private func todayString() -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: Date())
  }
}
