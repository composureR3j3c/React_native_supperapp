import { FlexWidget, ImageWidget } from 'react-native-android-widget';

const ICON_SIZE = 56;

// 1x1 round home screen button that opens Driver Assistant.
export function LauncherWidget() {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel="Open Driver Assistant"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ImageWidget
        image={require('../assets/icon.png')}
        imageWidth={ICON_SIZE}
        imageHeight={ICON_SIZE}
        radius={ICON_SIZE / 2}
        clickAction="OPEN_APP"
      />
    </FlexWidget>
  );
}
