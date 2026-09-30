import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useTheme } from '../theme/ThemeProvider';

// OpenStreetMap tiles rendered by Leaflet inside a WebView, so no map API key is needed.
const LEAFLET_VERSION = '1.9.4';

function regionToZoom(region) {
  return Math.max(1, Math.min(18, Math.round(Math.log2(360 / region.longitudeDelta))));
}

function buildHtml(region, scheme, pinColor) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <script src="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <style>
    html, body, #map { height: 100%; margin: 0; background: #fff; }
    /* Dark mode: invert the light OSM tiles into a dark map instead of loading a second tile set. */
    body.dark, body.dark #map { background: #000; }
    body.dark .leaflet-tile { filter: invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9); }
    body.dark .leaflet-control-attribution { background: rgba(0, 0, 0, 0.75); color: #d6d6d6; }
    body.dark .leaflet-control-attribution a { color: #7fc8d6; }
  </style>
</head>
<body class="${scheme === 'dark' ? 'dark' : ''}">
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false })
      .setView([${region.latitude}, ${region.longitude}], ${regionToZoom(region)});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    var pin = null;
    var pinColor = '${pinColor}';
    window.setPin = function (lat, lng) {
      if (pin) pin.setLatLng([lat, lng]);
      else pin = L.circleMarker([lat, lng], {
        radius: 10, color: document.body.classList.contains('dark') ? '#000' : '#fff', weight: 3, fillColor: pinColor, fillOpacity: 1,
      }).addTo(map);
    };
    window.setTheme = function (dark, color) {
      document.body.classList.toggle('dark', dark);
      pinColor = color;
      if (pin) pin.setStyle({ fillColor: color, color: dark ? '#000' : '#fff' });
    };
    window.clearPin = function () {
      if (pin) { map.removeLayer(pin); pin = null; }
    };

    map.on('click', function (e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
    });
  </script>
</body>
</html>`;
}

export default function LocationPickerMap({ initialRegion, pickedCoords, onPick, style }) {
  const { scheme, colors } = useTheme();
  const webViewRef = useRef(null);
  // Build the page once; later region, pin and theme changes are pushed in with injectJavaScript.
  const html = useMemo(() => buildHtml(initialRegion, scheme, colors.primary), []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadedRef = useRef(false);

  const centerMap = () => {
    webViewRef.current?.injectJavaScript(
      `map.setView([${initialRegion.latitude}, ${initialRegion.longitude}], ${regionToZoom(initialRegion)}); true;`
    );
  };

  const syncPin = () => {
    webViewRef.current?.injectJavaScript(
      pickedCoords
        ? `setPin(${pickedCoords.latitude}, ${pickedCoords.longitude}); true;`
        : 'clearPin(); true;'
    );
  };

  // Before the page loads there is no `map` yet; handleLoadEnd applies the latest state instead.
  useEffect(() => {
    if (loadedRef.current) centerMap();
  }, [initialRegion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loadedRef.current) syncPin();
  }, [pickedCoords]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncTheme = () => {
    webViewRef.current?.injectJavaScript(`setTheme(${scheme === 'dark'}, '${colors.primary}'); true;`);
  };

  useEffect(() => {
    if (loadedRef.current) syncTheme();
  }, [scheme]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadEnd = () => {
    loadedRef.current = true;
    centerMap();
    syncPin();
    syncTheme();
  };

  const handleMessage = (event) => {
    try {
      const { latitude, longitude } = JSON.parse(event.nativeEvent.data);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        onPick({ latitude, longitude });
      }
    } catch {
      // Ignore messages that aren't coordinates.
    }
  };

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={webViewRef}
        style={[styles.map, { backgroundColor: colors.background }]}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        onLoadEnd={handleLoadEnd}
        applicationNameForUserAgent="DriverAssistant/1.0"
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});
