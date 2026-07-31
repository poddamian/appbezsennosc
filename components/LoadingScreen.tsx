import { ActivityIndicator, View } from 'react-native';

export function LoadingScreen() {
  return (
    <View
      className="flex-1 items-center justify-center bg-indigo-50"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Ładowanie">
      <ActivityIndicator color="#6d28d9" />
    </View>
  );
}
