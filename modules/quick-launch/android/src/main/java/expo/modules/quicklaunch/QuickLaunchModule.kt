package expo.modules.quicklaunch

import android.graphics.Color
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class QuickLaunchModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("QuickLaunch")

    Function("isEnabled") {
      QuickLaunchService.isEnabled(context)
    }

    Function("start") { title: String, text: String, color: String ->
      QuickLaunchService.start(context, title, text, Color.parseColor(color))
    }

    Function("stop") {
      QuickLaunchService.stop(context)
    }
  }
}
