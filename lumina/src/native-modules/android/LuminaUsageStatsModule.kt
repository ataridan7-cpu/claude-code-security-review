package com.lumina.app

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*
import java.util.Calendar
import java.util.UUID

/**
 * Android native module — wraps UsageStatsManager to provide screen time data.
 *
 * Requires PACKAGE_USAGE_STATS permission, which users must grant via
 * Settings > Apps > Special App Access > Usage Access (not a runtime dialog).
 *
 * Register in MainApplication.kt by adding LuminaUsageStatsPackage() to packages list.
 */
class LuminaUsageStatsModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "LuminaUsageStats"

  @ReactMethod
  fun requestPermission(promise: Promise) {
    if (hasUsagePermission()) {
      promise.resolve("granted")
      return
    }
    // Navigate to the special settings screen — user must enable manually
    try {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      reactContext.startActivity(intent)
      promise.resolve("undetermined") // will re-check on app resume
    } catch (e: Exception) {
      promise.resolve("unavailable")
    }
  }

  @ReactMethod
  fun hasPermission(promise: Promise) {
    promise.resolve(hasUsagePermission())
  }

  @ReactMethod
  fun getTodayUsage(promise: Promise) {
    if (!hasUsagePermission()) {
      promise.reject("PERMISSION_DENIED", "Usage stats permission not granted")
      return
    }
    val calendar = Calendar.getInstance()
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    val startMs = calendar.timeInMillis
    val endMs = System.currentTimeMillis()

    promise.resolve(queryUsage(startMs, endMs))
  }

  @ReactMethod
  fun getUsageForRange(startMs: Double, endMs: Double, promise: Promise) {
    if (!hasUsagePermission()) {
      promise.reject("PERMISSION_DENIED", "Usage stats permission not granted")
      return
    }
    promise.resolve(queryUsage(startMs.toLong(), endMs.toLong()))
  }

  @ReactMethod
  fun getPickUpCount(promise: Promise) {
    // Android does not expose pick-up count — return 0
    promise.resolve(0)
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private fun hasUsagePermission(): Boolean {
    val appOps = reactContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = appOps.checkOpNoThrow(
      AppOpsManager.OPSTR_GET_USAGE_STATS,
      android.os.Process.myUid(),
      reactContext.packageName
    )
    return mode == AppOpsManager.MODE_ALLOWED
  }

  private fun queryUsage(startMs: Long, endMs: Long): WritableArray {
    val usm = reactContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startMs, endMs)

    val results = Arguments.createArray()
    val calendar = Calendar.getInstance().apply { timeInMillis = startMs }
    val dateStr = "%d-%02d-%02d".format(
      calendar.get(Calendar.YEAR),
      calendar.get(Calendar.MONTH) + 1,
      calendar.get(Calendar.DAY_OF_MONTH)
    )

    for (stat in stats) {
      if (stat.totalTimeInForeground < 10_000) continue // skip < 10s

      val record = Arguments.createMap().apply {
        putString("id", UUID.randomUUID().toString())
        putString("bundle_id", stat.packageName)
        putString("app_name", getAppName(stat.packageName))
        putString("category", categorize(stat.packageName))
        putInt("duration_seconds", (stat.totalTimeInForeground / 1000).toInt())
        putDouble("session_start", stat.firstTimeStamp.toDouble())
        putDouble("session_end", stat.lastTimeStamp.toDouble())
        putString("date", dateStr)
        putString("platform", "android")
      }
      results.pushMap(record)
    }

    return results
  }

  private fun getAppName(packageName: String): String {
    return try {
      val pm = reactContext.packageManager
      val info = pm.getApplicationInfo(packageName, 0)
      pm.getApplicationLabel(info).toString()
    } catch (e: Exception) {
      packageName.split('.').last().replaceFirstChar { it.uppercase() }
    }
  }

  private fun categorize(packageName: String): String {
    return when {
      packageName.contains("instagram") || packageName.contains("tiktok") ||
        packageName.contains("twitter") || packageName.contains("snapchat") ||
        packageName.contains("facebook") -> "social"
      packageName.contains("youtube") || packageName.contains("netflix") ||
        packageName.contains("spotify") || packageName.contains("twitch") -> "entertainment"
      packageName.contains("gmail") || packageName.contains("slack") ||
        packageName.contains("whatsapp") || packageName.contains("telegram") -> "communication"
      packageName.contains("chrome") || packageName.contains("notion") ||
        packageName.contains("docs") || packageName.contains("sheets") -> "productivity"
      packageName.contains("game") || packageName.contains("clash") ||
        packageName.contains("candy") -> "games"
      packageName.contains("news") || packageName.contains("reddit") -> "news"
      else -> "other"
    }
  }
}
