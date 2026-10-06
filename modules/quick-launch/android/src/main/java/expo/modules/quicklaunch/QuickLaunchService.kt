package expo.modules.quicklaunch

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

// Foreground service whose only job is to keep the quick-launch notification pinned. It does no work.
class QuickLaunchService : Service() {
  companion object {
    private const val CHANNEL_ID = "quick_launch"
    private const val NOTIFICATION_ID = 4101
    private const val ACTION_REPOST = "expo.modules.quicklaunch.REPOST"
    private const val PREFS = "quick_launch"
    private const val KEY_ENABLED = "enabled"
    private const val KEY_TITLE = "title"
    private const val KEY_TEXT = "text"
    private const val KEY_COLOR = "color"

    fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    // null = never chosen, so the app can turn it on by default on first launch.
    fun isEnabled(context: Context): Boolean? =
      if (prefs(context).contains(KEY_ENABLED)) prefs(context).getBoolean(KEY_ENABLED, false) else null

    fun start(context: Context, title: String, text: String, color: Int) {
      prefs(context).edit()
        .putBoolean(KEY_ENABLED, true)
        .putString(KEY_TITLE, title)
        .putString(KEY_TEXT, text)
        .putInt(KEY_COLOR, color)
        .apply()
      context.startForegroundService(Intent(context, QuickLaunchService::class.java))
    }

    fun stop(context: Context) {
      prefs(context).edit().putBoolean(KEY_ENABLED, false).apply()
      context.stopService(Intent(context, QuickLaunchService::class.java))
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (isEnabled(this) != true) {
      stopSelf()
      return START_NOT_STICKY
    }
    ServiceCompat.startForeground(
      this,
      NOTIFICATION_ID,
      buildNotification(),
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE else 0
    )
    return START_STICKY
  }

  private fun buildNotification(): Notification {
    val manager = getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) == null) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Quick launch", NotificationManager.IMPORTANCE_LOW).apply {
          description = "Keeps a shortcut in the notification shade to open the app"
          setShowBadge(false)
        }
      )
    }

    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
    }
    val openApp = PendingIntent.getActivity(this, 0, launchIntent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    // Android 14+ lets users swipe away even ongoing notifications; post it again when that happens.
    val repost = PendingIntent.getService(
      this,
      1,
      Intent(this, QuickLaunchService::class.java).setAction(ACTION_REPOST),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )

    val prefs = prefs(this)
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_quick_launch)
      .setContentTitle(prefs.getString(KEY_TITLE, null) ?: applicationInfo.loadLabel(packageManager))
      .setContentText(prefs.getString(KEY_TEXT, null) ?: "Tap to open")
      .setColor(prefs.getInt(KEY_COLOR, 0))
      .setContentIntent(openApp)
      .setDeleteIntent(repost)
      .setOngoing(true)
      .setShowWhen(false)
      .setSilent(true)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
      .build()
  }
}
