import { View } from 'react-native';

type ProgressBarProps = {
  progress: number;
};

export function ProgressBar({ progress }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View
      className="h-3 w-full overflow-hidden rounded-full bg-violet-100"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}>
      <View className="h-full rounded-full bg-violet-500" style={{ width: `${clamped * 100}%` }} />
    </View>
  );
}
