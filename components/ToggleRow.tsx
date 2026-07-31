import { Pressable, Text, View } from 'react-native';

type ToggleRowProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      className={`flex-row items-center justify-between rounded-2xl border px-4 py-4 ${
        value ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-white'
      }`}>
      <Text className="mr-3 flex-1 text-base text-slate-800">{label}</Text>
      <View className={`h-8 w-14 justify-center rounded-full p-1 ${value ? 'bg-violet-500' : 'bg-slate-200'}`}>
        <View
          className="h-6 w-6 rounded-full bg-white"
          style={{ marginLeft: value ? 24 : 0 }}
        />
      </View>
    </Pressable>
  );
}
