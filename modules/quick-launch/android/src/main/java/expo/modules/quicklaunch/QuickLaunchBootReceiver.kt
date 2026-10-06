package expo.modules.quicklaunch

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

// Puts the notification back after the phone restarts, if the user left it turned on.
class QuickLaunchBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED && QuickLaunchService.isEnabled(context) == true) {
      context.startForegroundService(Intent(context, QuickLaunchService::class.java))
    }
  }
}
