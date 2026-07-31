import { Pressable, Text, View } from 'react-native';

type ErrorStateProps = {
  message?: string;
  onRetry: () => void;
};

export function ErrorState({
  message = 'Nie udało się połączyć z serwerem. Spróbuj ponownie.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-indigo-50 px-8">
      <Text style={{ fontSize: 36 }}>⚠️</Text>
      <Text accessibilityRole="alert" className="text-center text-base text-slate-600">
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Spróbuj ponownie"
        className="rounded-2xl bg-indigo-900 px-6 py-3">
        <Text className="font-semibold text-white">Spróbuj ponownie</Text>
      </Pressable>
    </View>
  );
}
