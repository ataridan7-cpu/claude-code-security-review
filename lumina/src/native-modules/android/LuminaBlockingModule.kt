package com.lumina.app

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.*
import org.json.JSONObject

/**
 * React Native bridge module for the Android app-blocking feature.
 *
 * Exposes:
 *   startService()                                    → starts LuminaBlockingService
 *   stopService()                                     → stops LuminaBlockingService
 *   registerBlockedApp(bundleId, dailyLimitSeconds)   → adds app to block list
 *   unregisterBlockedApp(bundleId)                    → removes app from block list
 *
 * Blocked apps are stored in SharedPreferences as a JSON object:
 *   { "com.tiktok.TikTok": 1800, "com.instagram.ios": 3600 }
 * where values are dailyLimitSeconds.
 *
 * Register via LuminaBlockingPackage → MainApplication.kt.
 */
class LuminaBlockingModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "LuminaBlocking"

    @ReactMethod
    fun startService(promise: Promise) {
        try {
            val intent = Intent(reactContext, LuminaBlockingService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("START_SERVICE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopService(promise: Promise) {
        try {
            val intent = Intent(reactContext, LuminaBlockingService::class.java)
            reactContext.stopService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("STOP_SERVICE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun registerBlockedApp(bundleId: String, dailyLimitSeconds: Int, promise: Promise) {
        try {
            val prefs = LuminaBlockingService.getPrefs(reactContext)
            val json = JSONObject(prefs.getString(LuminaBlockingService.KEY_BLOCKED_APPS, "{}") ?: "{}")
            json.put(bundleId, dailyLimitSeconds)
            prefs.edit().putString(LuminaBlockingService.KEY_BLOCKED_APPS, json.toString()).apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("REGISTER_ERROR", e.message)
        }
    }

    @ReactMethod
    fun unregisterBlockedApp(bundleId: String, promise: Promise) {
        try {
            val prefs = LuminaBlockingService.getPrefs(reactContext)
            val json = JSONObject(prefs.getString(LuminaBlockingService.KEY_BLOCKED_APPS, "{}") ?: "{}")
            json.remove(bundleId)
            prefs.edit().putString(LuminaBlockingService.KEY_BLOCKED_APPS, json.toString()).apply()
            // Also clear any grace period
            prefs.edit().remove(LuminaBlockingService.KEY_GRACE_PREFIX + bundleId).apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("UNREGISTER_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        try {
            val prefs = LuminaBlockingService.getPrefs(reactContext)
            val json = prefs.getString(LuminaBlockingService.KEY_BLOCKED_APPS, "{}") ?: "{}"
            promise.resolve(json)
        } catch (e: Exception) {
            promise.reject("GET_ERROR", e.message)
        }
    }
}
