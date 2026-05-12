package com.lumina.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat

/**
 * Foreground service that polls UsageStatsManager every second.
 * When a blocked app is detected in the foreground, launches LuminaBlockedOverlayActivity.
 *
 * Lifecycle:
 *   - Started by LuminaBlockingModule.startService()
 *   - Stopped by LuminaBlockingModule.stopService()
 *   - Survives app backgrounding (foreground service)
 *
 * Blocked app list is read from SharedPreferences key "lumina_blocked_apps" (JSON object
 * bundleId → dailyLimitSeconds). Grace periods (after user taps "Ignore once") are stored
 * under "lumina_grace_until_<bundleId>" as a Unix timestamp ms.
 */
class LuminaBlockingService : Service() {

    companion object {
        const val CHANNEL_ID = "lumina_blocking"
        const val NOTIFICATION_ID = 7001
        const val PREFS_NAME = "lumina_blocking"
        const val KEY_BLOCKED_APPS = "lumina_blocked_apps"
        const val KEY_GRACE_PREFIX = "lumina_grace_until_"

        fun getPrefs(context: Context): SharedPreferences =
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    private val handler = Handler(Looper.getMainLooper())
    private var lastBlockedApp: String? = null
    private var overlayShowing = false

    private val pollRunnable = object : Runnable {
        override fun run() {
            checkForegroundApp()
            handler.postDelayed(this, 1000L)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, buildNotification())
        handler.post(pollRunnable)
        return START_STICKY // restart if killed
    }

    override fun onDestroy() {
        handler.removeCallbacks(pollRunnable)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ── Core polling logic ────────────────────────────────────────────────────

    private fun checkForegroundApp() {
        val foregroundPackage = getForegroundApp() ?: return

        // Never block Lumina itself
        if (foregroundPackage == packageName) {
            overlayShowing = false
            lastBlockedApp = null
            return
        }

        val blockedApps = getBlockedApps()
        if (!blockedApps.containsKey(foregroundPackage)) {
            overlayShowing = false
            lastBlockedApp = null
            return
        }

        // Check grace period
        val prefs = getPrefs(this)
        val graceUntil = prefs.getLong(KEY_GRACE_PREFIX + foregroundPackage, 0L)
        if (System.currentTimeMillis() < graceUntil) return

        // Check if we already have the overlay showing for this app
        if (overlayShowing && lastBlockedApp == foregroundPackage) return

        // Launch blocker overlay
        overlayShowing = true
        lastBlockedApp = foregroundPackage
        val appName = getAppName(foregroundPackage)
        launchOverlay(foregroundPackage, appName)
    }

    private fun getForegroundApp(): String? {
        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val now = System.currentTimeMillis()
        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_BEST, now - 3000L, now)
        return stats
            ?.filter { it.lastTimeUsed > 0 }
            ?.maxByOrNull { it.lastTimeUsed }
            ?.packageName
    }

    private fun getBlockedApps(): Map<String, Int> {
        val json = getPrefs(this).getString(KEY_BLOCKED_APPS, "{}") ?: "{}"
        return try {
            val result = mutableMapOf<String, Int>()
            val obj = org.json.JSONObject(json)
            obj.keys().forEach { key -> result[key] = obj.getInt(key) }
            result
        } catch (e: Exception) {
            emptyMap()
        }
    }

    private fun getAppName(packageName: String): String {
        return try {
            val info = packageManager.getApplicationInfo(packageName, 0)
            packageManager.getApplicationLabel(info).toString()
        } catch (e: Exception) {
            packageName.split('.').last().replaceFirstChar { it.uppercase() }
        }
    }

    private fun launchOverlay(packageName: String, appName: String) {
        val intent = Intent(this, LuminaBlockedOverlayActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("bundle_id", packageName)
            putExtra("app_name", appName)
        }
        startActivity(intent)
    }

    // ── Notification ──────────────────────────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Screen Time Guard",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Lumina monitors screen time in the background"
                setShowBadge(false)
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Lumina is watching your screen time")
            .setContentText("Your goal limits are active")
            .setSmallIcon(android.R.drawable.ic_menu_recent_history)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
}
