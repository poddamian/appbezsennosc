import { Pressable, Text, View } from 'react-native';

import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const { session } = useAuth();

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-white px-6">
      <Text className="text-xl font-semibold text-slate-800">Profil</Text>
      {session?.user.email ? (
        <Text className="text-sm text-slate-500">{session.user.email}</Text>
      ) : null}
      <Pressable
        onPress={() => supabase.auth.signOut()}
        className="items-center rounded-lg bg-slate-900 px-6 py-3">
        <Text className="text-base font-semibold text-white">Wyloguj się</Text>
      </Pressable>
    </View>
  );
}
