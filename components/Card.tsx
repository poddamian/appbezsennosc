import type { ReactNode } from 'react';
import { View } from 'react-native';

export function Card({ children }: { children: ReactNode }) {
  return (
    <View
      className="rounded-3xl bg-white p-5"
      style={{
        shadowColor: '#4c1d95',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}>
      {children}
    </View>
  );
}
