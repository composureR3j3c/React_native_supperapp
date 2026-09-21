import { StyleSheet, Text, View } from 'react-native';

export default function LocationPickerMap({ style }) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.text}>
        Picking a location on the map isn't available on web — use the mobile app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
