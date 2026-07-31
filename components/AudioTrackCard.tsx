import { Pressable, Text, View } from 'react-native';

import { formatDuration, type AudioTrack } from '../lib/audioLibrary';

type AudioTrackCardProps = {
  track: AudioTrack;
  isActive: boolean;
  isPlaying: boolean;
  isLocked: boolean;
  onPress: () => void;
};

export function AudioTrackCard({ track, isActive, isPlaying, isLocked, onPress }: AudioTrackCardProps) {
  const showPause = isActive && isPlaying;

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center rounded-2xl border px-4 py-4 ${
        isActive ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-white'
      }`}>
      <View className="flex-1">
        <Text className={`text-base font-medium ${isActive ? 'text-violet-900' : 'text-slate-800'}`}>
          {track.title}
        </Text>
        <Text className="mt-1 text-xs text-slate-400">{formatDuration(track.durationSeconds)}</Text>
      </View>
      <View
        className={`h-11 w-11 items-center justify-center rounded-full ${
          isActive ? 'bg-violet-600' : isLocked ? 'bg-slate-100' : 'bg-violet-100'
        }`}>
        <Text className={`text-lg ${isActive ? 'text-white' : isLocked ? 'text-slate-400' : 'text-violet-900'}`}>
          {isLocked ? '🔒' : showPause ? '❚❚' : '▶'}
        </Text>
      </View>
    </Pressable>
  );
}
