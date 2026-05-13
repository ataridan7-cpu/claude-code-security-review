package com.lumina.app

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONArray
import org.json.JSONObject

/**
 * Full-screen Activity launched by LuminaBlockingService when a blocked app
 * comes to the foreground.
 *
 * Layout (built in code — no XML needed for a native-only Activity):
 *   - App name + "You've hit your daily limit"
 *   - "Go home" button → sends user to launcher
 *   - "Ignore for 5 min" button → writes grace period to SharedPreferences,
 *     allowing LuminaBlockingService to skip this app for 5 minutes
 *
 * Uses FLAG_SHOW_WHEN_LOCKED so it appears even on the lock screen.
 */
class LuminaBlockedOverlayActivity : Activity() {

    private val GRACE_DURATION_MS = 5 * 60 * 1000L // 5 minutes

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Ensure we appear over the blocked app even when locked
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        )

        val bundleId = intent.getStringExtra("bundle_id") ?: ""
        val appName = intent.getStringExtra("app_name") ?: "this app"

        setContentView(buildLayout(appName, bundleId))
    }

    // ── Layout ────────────────────────────────────────────────────────────────

    private fun buildLayout(appName: String, bundleId: String): LinearLayout {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(64, 64, 64, 64)
            setBackgroundColor(0xFF0A0A14.toInt()) // Colors.background
        }

        // Emoji
        root.addView(TextView(this).apply {
            text = "⏸"
            textSize = 64f
            gravity = Gravity.CENTER
        })

        // Title
        root.addView(TextView(this).apply {
            text = "Time's up on $appName"
            textSize = 24f
            setTextColor(0xFFF0F0F8.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 32, 0, 16)
        })

        // Subtitle
        root.addView(TextView(this).apply {
            text = "You've hit your daily limit for this app."
            textSize = 16f
            setTextColor(0xFF9090B8.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 48)
        })

        // Go home button
        root.addView(Button(this).apply {
            text = "Go home"
            textSize = 16f
            setTextColor(0xFF0A0A14.toInt())
            setBackgroundColor(0xFF7C5CFC.toInt())
            setPadding(48, 24, 48, 24)
            setOnClickListener { goHome() }
        })

        // Spacer
        root.addView(TextView(this).apply { setPadding(0, 16, 0, 0) })

        // Ignore button
        root.addView(Button(this).apply {
            text = "Ignore for 5 minutes"
            textSize = 14f
            setTextColor(0xFF9090B8.toInt())
            setBackgroundColor(0xFF12121F.toInt())
            setOnClickListener { ignoreForGracePeriod(bundleId) }
        })

        return root
    }

    // ── Actions ───────────────────────────────────────────────────────────────

    private fun goHome() {
        val homeIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(homeIntent)
        finish()
    }

    private fun ignoreForGracePeriod(bundleId: String) {
        val graceUntil = System.currentTimeMillis() + GRACE_DURATION_MS
        LuminaBlockingService.getPrefs(this).edit()
            .putLong(LuminaBlockingService.KEY_GRACE_PREFIX + bundleId, graceUntil)
            .apply()

        // Signal the blocking service that overlay is dismissed
        finish()
    }

    override fun onBackPressed() {
        // Intercept back press — user must explicitly go home or ignore
        goHome()
    }
}
