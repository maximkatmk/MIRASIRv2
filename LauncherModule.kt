package com.miracity.launcher

import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import com.facebook.react.bridge.*

class LauncherModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
  override fun getName() = "MiraLauncher"

  /** ABI-urile dispozitivului; is64 = true dacă suportă arm64-v8a. */
  @ReactMethod
  fun getDeviceInfo(promise: Promise) {
    val m = Arguments.createMap()
    val abis = Arguments.createArray()
    Build.SUPPORTED_ABIS.forEach { abis.pushString(it) }
    m.putArray("abis", abis)
    m.putBoolean("is64", Build.SUPPORTED_64_BIT_ABIS.contains("arm64-v8a"))
    m.putInt("sdk", Build.VERSION.SDK_INT)
    m.putString("model", Build.MODEL)
    promise.resolve(m)
  }

  @ReactMethod
  fun isInstalled(pkg: String, promise: Promise) {
    try {
      ctx.packageManager.getPackageInfo(pkg, 0)
      promise.resolve(true)
    } catch (e: PackageManager.NameNotFoundException) {
      promise.resolve(false)
    }
  }

  /** Pornește clientul de joc cu parametrii de conectare ca extras de Intent. */
  @ReactMethod
  fun launchGame(pkg: String, activity: String, extras: ReadableMap, promise: Promise) {
    try {
      val i = Intent().apply {
        component = ComponentName(pkg, activity)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        val it = extras.keySetIterator()
        while (it.hasNextKey()) {
          val k = it.nextKey()
          when (extras.getType(k)) {
            ReadableType.String -> putExtra(k, extras.getString(k))
            ReadableType.Number -> putExtra(k, extras.getDouble(k).toInt())
            ReadableType.Boolean -> putExtra(k, extras.getBoolean(k))
            else -> {}
          }
        }
      }
      ctx.startActivity(i)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("LAUNCH_FAILED", e.message, e)
    }
  }

  /** Deschide pagina de instalare/setări a clientului (APK-ul se instalează manual din linkul tău). */
  @ReactMethod
  fun openUrl(url: String, promise: Promise) {
    try {
      ctx.startActivity(Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("OPEN_FAILED", e.message, e)
    }
  }
}
