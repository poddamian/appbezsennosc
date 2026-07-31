import { Text } from 'react-native';

export function InlineError({ message }: { message: string }) {
  return (
    <Text accessibilityRole="alert" className="mt-3 text-sm text-red-600">
      {message}
    </Text>
  );
}
