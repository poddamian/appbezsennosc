import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AudioTrackCard } from '../../components/AudioTrackCard';
import { Card } from '../../components/Card';
import { MiniPlayer } from '../../components/MiniPlayer';
import { AUDIO_CATEGORIES, findTrack, type AudioTrack } from '../../lib/audioLibrary';

type SleepTimerMinutes = 10 | 20 | 30;

/** How long before the timer ends to start fading the volume down to 0. */
const FADE_OUT_SECONDS = 15;

export default function RelaxScreen() {
  const player = useAudioPlayer(null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<SleepTimerMinutes | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  const activeTrack = activeTrackId ? findTrack(activeTrackId) : undefined;

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
  }, []);

  // Non-looping tracks (breathing/meditation) rewind to the start once
  // finished, so pressing play again on the card or mini-player restarts
  // them instead of doing nothing.
  useEffect(() => {
    if (status.didJustFinish && activeTrack && !activeTrack.loop) {
      player.seekTo(0);
    }
  }, [status.didJustFinish, activeTrack, player]);

  useEffect(() => {
    if (sleepTimerMinutes === null) return;

    const intervalId = setInterval(() => {
      setSleepTimerRemaining((current) => {
        if (current === null) return current;
        const next = current - 1;

        if (next <= FADE_OUT_SECONDS) {
          player.volume = Math.max(next / FADE_OUT_SECONDS, 0);
        }

        if (next <= 0) {
          player.pause();
          player.volume = 1;
          setSleepTimerMinutes(null);
          return null;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [sleepTimerMinutes, player]);

  function cancelSleepTimer() {
    player.volume = 1;
    setSleepTimerMinutes(null);
    setSleepTimerRemaining(null);
  }

  function handleSelectSleepTimer(minutes: SleepTimerMinutes) {
    if (sleepTimerMinutes === minutes) {
      cancelSleepTimer();
      return;
    }
    player.volume = 1;
    setSleepTimerMinutes(minutes);
    setSleepTimerRemaining(minutes * 60);
  }

  function handleSelectTrack(track: AudioTrack) {
    if (activeTrackId === track.id) {
      status.playing ? player.pause() : player.play();
      return;
    }

    player.replace(track.source);
    player.loop = track.loop;
    player.volume = 1;
    player.play();
    player.setActiveForLockScreen(
      true,
      { title: track.title, artist: 'SleepTrack' },
      { showSeekForward: false, showSeekBackward: false, isLiveStream: track.loop }
    );
    setActiveTrackId(track.id);
  }

  function handleTogglePlay() {
    status.playing ? player.pause() : player.play();
  }

  function handleClosePlayer() {
    player.pause();
    player.clearLockScreenControls();
    setActiveTrackId(null);
    cancelSleepTimer();
  }

  return (
    <View className="flex-1 bg-indigo-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: activeTrack ? 24 : 40, gap: 16 }}>
        <View>
          <Text className="text-sm font-medium text-violet-500">Chwila dla siebie</Text>
          <Text className="mt-1 text-3xl font-bold text-indigo-950">Wyciszenie</Text>
        </View>

        {AUDIO_CATEGORIES.map((category) => (
          <Card key={category.id}>
            <Text className="text-lg font-semibold text-indigo-950">{category.title}</Text>
            <View className="mt-4 gap-3">
              {category.tracks.map((track) => (
                <AudioTrackCard
                  key={track.id}
                  track={track}
                  isActive={activeTrackId === track.id}
                  isPlaying={activeTrackId === track.id && status.playing}
                  onPress={() => handleSelectTrack(track)}
                />
              ))}
            </View>
          </Card>
        ))}
      </ScrollView>

      {activeTrack ? (
        <MiniPlayer
          track={activeTrack}
          isPlaying={status.playing}
          currentTime={status.currentTime}
          duration={status.duration}
          onTogglePlay={handleTogglePlay}
          onClose={handleClosePlayer}
          sleepTimerMinutes={sleepTimerMinutes}
          sleepTimerRemainingSeconds={sleepTimerRemaining}
          onSelectSleepTimer={handleSelectSleepTimer}
        />
      ) : null}
    </View>
  );
}
