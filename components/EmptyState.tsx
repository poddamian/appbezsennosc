import { Pressable, Text, View } from 'react-native';

type EmptyStateProps = {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ emoji = '🌙', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center px-2 py-4">
      <Text style={{ fontSize: 36 }}>{emoji}</Text>
      <Text className="mt-3 text-center text-base font-semibold text-indigo-950">{title}</Text>
      {description ? (
        <Text className="mt-1 text-center text-sm text-slate-500">{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          className="mt-4 rounded-2xl bg-violet-100 px-5 py-2.5">
          <Text className="font-semibold text-violet-900">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
