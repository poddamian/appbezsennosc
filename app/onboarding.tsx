import { useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useOnboarding } from '../lib/onboarding';

type Slide = { emoji: string; title: string; body: string };

const SLIDES: Slide[] = [
  {
    emoji: '🌙',
    title: 'Odkryj, co naprawdę wpływa na Twój sen',
    body: 'Kofeina, stres, czas przed ekranem — zobacz, co realnie zmienia jakość Twojego wypoczynku.',
  },
  {
    emoji: '⏱️',
    title: '30 sekund dziennie wystarczy',
    body: 'Kilka dotknięć rano i wieczorem. Bez długich formularzy, bez zbędnych pytań.',
  },
  {
    emoji: '📈',
    title: 'Zobacz swoje wzorce po tygodniu',
    body: 'Po kilku dniach dziennika pokażemy Ci powtarzające się zależności w Twoich statystykach.',
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useOnboarding();
  const scrollRef = useRef<ScrollView>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [index, setIndex] = useState(0);

  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (pageWidth === 0) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setIndex(nextIndex);
  }

  function goToNext() {
    if (index >= SLIDES.length - 1) {
      completeOnboarding();
      return;
    }
    const nextIndex = index + 1;
    scrollRef.current?.scrollTo({ x: nextIndex * pageWidth, animated: true });
    setIndex(nextIndex);
  }

  const isLast = index === SLIDES.length - 1;

  return (
    <View className="flex-1 bg-indigo-50" onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        className="flex-1">
        {SLIDES.map((slide) => (
          <View key={slide.title} style={{ width: pageWidth }} className="items-center justify-center px-10">
            <Text style={{ fontSize: 64 }}>{slide.emoji}</Text>
            <Text className="mt-6 text-center text-2xl font-bold text-indigo-950">{slide.title}</Text>
            <Text className="mt-4 text-center text-base leading-6 text-slate-600">{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View className="items-center pb-10 pt-4">
        <View className="flex-row gap-2">
          {SLIDES.map((slide, dotIndex) => (
            <View
              key={slide.title}
              className={`h-2 w-2 rounded-full ${dotIndex === index ? 'bg-violet-600' : 'bg-violet-200'}`}
            />
          ))}
        </View>

        <Pressable onPress={goToNext} className="mt-6 w-11/12 items-center rounded-2xl bg-indigo-900 py-4">
          <Text className="text-base font-semibold text-white">{isLast ? 'Zaczynamy' : 'Dalej'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
