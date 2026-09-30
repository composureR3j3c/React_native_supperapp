import { LauncherWidget } from './LauncherWidget';

const WIDGETS = {
  Launcher: LauncherWidget,
};

export async function widgetTaskHandler({ widgetInfo, widgetAction, renderWidget }) {
  const Widget = WIDGETS[widgetInfo.widgetName];
  if (!Widget) return;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      renderWidget(<Widget />);
      break;
    default:
      break;
  }
}
