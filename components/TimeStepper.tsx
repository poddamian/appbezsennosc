import { Pressable, Text, View } from 'react-native';

import type { TimeValue } from '../lib/journal';

type TimeStepperProps = {
  label: string;
  value: TimeValue | null;
  defaultValue: TimeValue;
  onChange: (value: TimeValue | null) => void;
  allowClear?: boolean;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function TimeStepper({ label, value, defaultValue, onChange, allowClear = true }: TimeStepperProps) {
  if (!value) {
    return (
      <View className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4">
        <Text className="text-base text-slate-800">{label}</Text>
        <Pressable
          onPress={() => onChange(defaultValue)}
          accessibilityRole="button"
          accessibilityLabel={`Ustaw ${label.toLowerCase()}`}
          className="rounded-full bg-violet-100 px-4 py-2">
          <Text className="font-semibold text-violet-900">Ustaw</Text>
        </Pressable>
      </View>
    );
  }

  function adjustHour(delta: number) {
    if (!value) return;
    onChange({ hour: (value.hour + delta + 24) % 24, minute: value.minute });
  }

  function adjustMinute(delta: number) {
    if (!value) return;
    let minute = value.minute + delta;
    let hour = value.hour;
    if (minute >= 60) {
      minute -= 60;
      hour = (hour + 1) % 24;
    } else if (minute < 0) {
      minute += 60;
      hour = (hour - 1 + 24) % 24;
    }
    onChange({ hour, minute });
  }

  return (
    <View className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base text-slate-800">{label}</Text>
        {allowClear ? (
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Pomiń ${label.toLowerCase()}`}>
            <Text className="text-sm text-slate-400">Pomiń</Text>
          </Pressable>
        ) : null}
      </View>
      <View className="mt-3 flex-row items-center justify-center gap-4">
        <TimeUnitControl
          value={pad(value.hour)}
          unitLabel="godzinę"
          onIncrement={() => adjustHour(1)}
          onDecrement={() => adjustHour(-1)}
        />
        <Text className="text-2xl font-bold text-slate-900">:</Text>
        <TimeUnitControl
          value={pad(value.minute)}
          unitLabel="minuty"
          onIncrement={() => adjustMinute(15)}
          onDecrement={() => adjustMinute(-15)}
        />
      </View>
    </View>
  );
}

function TimeUnitControl({
  value,
  unitLabel,
  onIncrement,
  onDecrement,
}: {
  value: string;
  unitLabel: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <View className="items-center">
      <Pressable
        onPress={onIncrement}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Zwiększ ${unitLabel}`}
        className="h-9 w-9 items-center justify-center rounded-full bg-violet-100">
        <Text className="text-base font-bold text-violet-900">+</Text>
      </Pressable>
      <Text className="my-1 text-2xl font-bold text-slate-900" accessibilityLabel={`${value}`}>
        {value}
      </Text>
      <Pressable
        onPress={onDecrement}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Zmniejsz ${unitLabel}`}
        className="h-9 w-9 items-center justify-center rounded-full bg-violet-100">
        <Text className="text-base font-bold text-violet-900">–</Text>
      </Pressable>
    </View>
  );
}
