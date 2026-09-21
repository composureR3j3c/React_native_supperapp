import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function LocationPickerMap({ initialRegion, pickedCoords, onPick, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        onPress={(event) => onPick(event.nativeEvent.coordinate)}
      >
        {pickedCoords ? <Marker coordinate={pickedCoords} /> : null}
      </MapView>
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
