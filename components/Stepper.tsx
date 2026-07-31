import { Pressable, Text, View } from 'react-native';

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function Stepper({ value, onChange, min = 0, max = 20 }: StepperProps) {
  return (
    <View className="flex-row items-center justify-center gap-8">
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={`h-14 w-14 items-center justify-center rounded-full ${
          value <= min ? 'bg-violet-50' : 'bg-violet-100'
        }`}>
        <Text className="text-2xl font-bold text-violet-900">–</Text>
      </Pressable>
      <Text className="w-10 text-center text-3xl font-bold text-slate-900">{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={`h-14 w-14 items-center justify-center rounded-full ${
          value >= max ? 'bg-violet-50' : 'bg-violet-100'
        }`}>
        <Text className="text-2xl font-bold text-violet-900">+</Text>
      </Pressable>
    </View>
  );
}
