import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { getAuthErrorMessage } from '../lib/auth';
import { supabase } from '../lib/supabase';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

type Mode = 'signIn' | 'signUp';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === 'signUp';

  function validate(): boolean {
    if (!EMAIL_REGEX.test(email.trim())) {
      setFieldError('Podaj poprawny adres email.');
      return false;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFieldError(`Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`);
      return false;
    }
    setFieldError(null);
    return true;
  }

  async function handleSubmit() {
    setFormError(null);
    setInfoMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    const credentials = { email: email.trim(), password };

    const { data, error } = isSignUp
      ? await supabase.auth.signUp(credentials)
      : await supabase.auth.signInWithPassword(credentials);

    setIsSubmitting(false);

    if (error) {
      setFormError(getAuthErrorMessage(error));
      return;
    }

    if (isSignUp && !data.session) {
      setInfoMessage('Sprawdź skrzynkę e-mail, aby potwierdzić konto, a następnie zaloguj się.');
    }
  }

  function toggleMode() {
    setMode((current) => (current === 'signIn' ? 'signUp' : 'signIn'));
    setFieldError(null);
    setFormError(null);
    setInfoMessage(null);
  }

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="mb-8 text-center text-2xl font-bold text-slate-900">
        {isSignUp ? 'Zarejestruj się' : 'Zaloguj się'}
      </Text>

      <View className="gap-3">
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          accessibilityLabel="Adres email"
          className="rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Hasło"
          secureTextEntry
          autoCapitalize="none"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          accessibilityLabel="Hasło"
          className="rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900"
        />
      </View>

      {fieldError ? <Text accessibilityRole="alert" className="mt-3 text-sm text-red-600">{fieldError}</Text> : null}
      {formError ? <Text accessibilityRole="alert" className="mt-3 text-sm text-red-600">{formError}</Text> : null}
      {infoMessage ? (
        <Text accessibilityRole="alert" className="mt-3 text-sm text-emerald-600">
          {infoMessage}
        </Text>
      ) : null}

      <Pressable
        onPress={handleSubmit}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={isSignUp ? 'Zarejestruj się' : 'Zaloguj się'}
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
        className="mt-6 items-center rounded-lg bg-slate-900 py-3 disabled:opacity-50">
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-base font-semibold text-white">
            {isSignUp ? 'Zarejestruj się' : 'Zaloguj się'}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={toggleMode}
        accessibilityRole="button"
        accessibilityLabel={isSignUp ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
        className="mt-4 items-center">
        <Text className="text-sm text-slate-600">
          {isSignUp ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
        </Text>
      </Pressable>
    </View>
  );
}
