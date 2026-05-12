package com.lumina.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * Registers LuminaBlockingModule with React Native.
 * Add to the packages list in MainApplication.kt:
 *
 *   override fun getPackages(): List<ReactPackage> = listOf(
 *     ...,
 *     LuminaUsageStatsPackage(),
 *     LuminaBlockingPackage(),   // ← add this
 *   )
 */
class LuminaBlockingPackage : ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
        listOf(LuminaBlockingModule(context))

    override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
