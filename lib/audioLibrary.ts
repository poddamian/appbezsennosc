export type AudioCategoryId = 'breathing' | 'meditation' | 'nature';

export type AudioTrack = {
  id: string;
  title: string;
  categoryId: AudioCategoryId;
  durationSeconds: number;
  /** Nature/white-noise tracks are meant to loop for as long as the user listens. */
  loop: boolean;
  source: number;
};

export type AudioCategory = {
  id: AudioCategoryId;
  title: string;
  tracks: AudioTrack[];
};

export const AUDIO_CATEGORIES: AudioCategory[] = [
  {
    id: 'breathing',
    title: 'Oddychanie',
    tracks: [
      {
        id: 'breathing-4-7-8',
        title: 'Oddech 4-7-8',
        categoryId: 'breathing',
        durationSeconds: 20,
        loop: false,
        source: require('../assets/audio/breathing-4-7-8.mp3'),
      },
      {
        id: 'box-breathing',
        title: 'Oddech pudełkowy',
        categoryId: 'breathing',
        durationSeconds: 20,
        loop: false,
        source: require('../assets/audio/box-breathing.mp3'),
      },
      {
        id: 'deep-belly-breathing',
        title: 'Głębokie oddychanie brzuszne',
        categoryId: 'breathing',
        durationSeconds: 20,
        loop: false,
        source: require('../assets/audio/deep-belly-breathing.mp3'),
      },
    ],
  },
  {
    id: 'meditation',
    title: 'Medytacja przed snem',
    tracks: [
      {
        id: 'body-scan',
        title: 'Skan ciała',
        categoryId: 'meditation',
        durationSeconds: 20,
        loop: false,
        source: require('../assets/audio/body-scan.mp3'),
      },
      {
        id: 'gratitude-meditation',
        title: 'Medytacja wdzięczności',
        categoryId: 'meditation',
        durationSeconds: 20,
        loop: false,
        source: require('../assets/audio/gratitude-meditation.mp3'),
      },
      {
        id: 'letting-go-of-the-day',
        title: 'Uwolnij dzisiejszy dzień',
        categoryId: 'meditation',
        durationSeconds: 20,
        loop: false,
        source: require('../assets/audio/letting-go-of-the-day.mp3'),
      },
    ],
  },
  {
    id: 'nature',
    title: 'Dźwięki natury / biały szum',
    tracks: [
      {
        id: 'rain',
        title: 'Deszcz',
        categoryId: 'nature',
        durationSeconds: 30,
        loop: true,
        source: require('../assets/audio/rain.mp3'),
      },
      {
        id: 'ocean-waves',
        title: 'Szum fal',
        categoryId: 'nature',
        durationSeconds: 30,
        loop: true,
        source: require('../assets/audio/ocean-waves.mp3'),
      },
      {
        id: 'white-noise',
        title: 'Biały szum',
        categoryId: 'nature',
        durationSeconds: 30,
        loop: true,
        source: require('../assets/audio/white-noise.mp3'),
      },
    ],
  },
];

export function findTrack(trackId: string): AudioTrack | undefined {
  for (const category of AUDIO_CATEGORIES) {
    const track = category.tracks.find((item) => item.id === trackId);
    if (track) return track;
  }
  return undefined;
}

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
