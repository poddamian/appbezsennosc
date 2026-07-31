import { Pressable, Text, View } from 'react-native';

import { formatDuration, type AudioTrack } from '../lib/audioLibrary';

const SLEEP_TIMER_OPTIONS = [10, 20, 30] as const;

type MiniPlayerProps = {
  track: AudioTrack;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onClose: () => void;
  sleepTimerMinutes: number | null;
  sleepTimerRemainingSeconds: number | null;
  onSelectSleepTimer: (minutes: (typeof SLEEP_TIMER_OPTIONS)[number]) => void;
};

export function MiniPlayer({
  track,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onClose,
  sleepTimerMinutes,
  sleepTimerRemainingSeconds,
  onSelectSleepTimer,
}: MiniPlayerProps) {
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <View
      className="border-t border-violet-100 bg-white px-5 pb-6 pt-3"
      style={{
        shadowColor: '#4c1d95',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
        elevation: 8,
      }}>
      <View className="h-1.5 w-full overflow-hidden rounded-full bg-violet-100">
        <View className="h-full rounded-full bg-violet-600" style={{ width: `${progress * 100}%` }} />
      </View>

      <View className="mt-3 flex-row items-center">
        <View className="flex-1">
          <Text className="text-base font-semibold text-indigo-950" numberOfLines={1}>
            {track.title}
          </Text>
          <Text className="mt-0.5 text-xs text-slate-400">
            {formatDuration(currentTime)} / {formatDuration(duration || track.durationSeconds)}
          </Text>
        </View>

        <Pressable
          onPress={onTogglePlay}
          className="mx-2 h-12 w-12 items-center justify-center rounded-full bg-violet-600">
          <Text className="text-xl text-white">{isPlaying ? '❚❚' : '▶'}</Text>
        </Pressable>

        <Pressable onPress={onClose} hitSlop={8} className="h-12 w-8 items-center justify-center">
          <Text className="text-xl text-slate-400">✕</Text>
        </Pressable>
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        <Text className="mr-1 text-xs text-slate-500">Zaśnij przy dźwięku:</Text>
        {SLEEP_TIMER_OPTIONS.map((minutes) => {
          const isSelected = sleepTimerMinutes === minutes;
          return (
            <Pressable
              key={minutes}
              onPress={() => onSelectSleepTimer(minutes)}
              className={`rounded-full px-3 py-1.5 ${isSelected ? 'bg-violet-600' : 'bg-violet-100'}`}>
              <Text className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-violet-900'}`}>
                {minutes} min
              </Text>
            </Pressable>
          );
        })}
        {sleepTimerMinutes !== null && sleepTimerRemainingSeconds !== null ? (
          <Text className="ml-1 text-xs text-violet-700">
            Wyciszenie za {formatDuration(sleepTimerRemainingSeconds)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
