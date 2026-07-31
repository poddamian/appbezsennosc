import { Pressable, Text, View } from 'react-native';

export type EmojiOption = {
  value: number;
  emoji: string;
  label: string;
};

type EmojiScaleProps = {
  options: EmojiOption[];
  value: number | null;
  onChange: (value: number) => void;
};

export function EmojiScale({ options, value, onChange }: EmojiScaleProps) {
  return (
    <View className="flex-row justify-between">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            hitSlop={6}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected }}
            className={`flex-1 items-center rounded-2xl py-3 ${
              selected ? 'bg-violet-200' : 'bg-white'
            }`}
            style={{ marginHorizontal: 3 }}>
            <Text style={{ fontSize: 30 }}>{option.emoji}</Text>
            <Text
              className={`mt-1 text-center text-[11px] ${
                selected ? 'font-semibold text-violet-900' : 'text-slate-500'
              }`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
