import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PinPad } from '@/components/PinPad';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useBiometric } from '@/hooks/useBiometric';

const PIN_LENGTH = 4;

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, login } = useAuth();
  const { isEnabled, canUseBiometric, biometricType, isLoading: bioLoading, authenticate } = useBiometric();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bioButtonScale = useRef(new Animated.Value(1)).current;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Auto-trigger biometric on first load if enabled
  useEffect(() => {
    if (!bioLoading && isEnabled && canUseBiometric) {
      // Small delay so the screen renders first
      const t = setTimeout(() => triggerBiometric(), 500);
      return () => clearTimeout(t);
    }
  }, [bioLoading, isEnabled, canUseBiometric]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleDigit = async (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === PIN_LENGTH) {
      const ok = await login(newPin);
      if (ok) {
        router.replace('/(tabs)/');
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        shake();
        setAttempts(a => a + 1);
        setError(attempts >= 2 ? 'Too many attempts. Try again later.' : 'Incorrect PIN. Try again.');
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setError('');
  };

  const triggerBiometric = async () => {
    // Bounce animation on the button
    Animated.sequence([
      Animated.timing(bioButtonScale, { toValue: 0.88, duration: 100, useNativeDriver: true }),
      Animated.timing(bioButtonScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    const success = await authenticate();
    if (success) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace('/(tabs)/');
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setError('Biometric authentication failed. Use your PIN.');
    }
  };

  const biometricIcon = biometricType === 'face' ? 'smile' : 'smartphone';

  const firstName = user?.name?.split(' ')[0] ?? 'Welcome';

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad + 16 }]}>
      <View style={styles.logoSection}>
        <Image
          source={require('@/assets/images/guudees-logo.png')}
          style={styles.logoImg}
          resizeMode="contain"
        />
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Good Money. Good Life.</Text>
      </View>

      <View style={styles.greetSection}>
        <Text style={[styles.greeting, { color: colors.foreground }]}>
          Welcome back,{'\n'}
          <Text style={{ color: colors.primary }}>{firstName}</Text>
        </Text>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>Enter your 4-digit PIN to continue</Text>
      </View>

      <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < pin.length ? colors.primary : 'transparent',
                borderColor: i < pin.length ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </Animated.View>

      {error ? (
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={14} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      ) : (
        <View style={styles.errorRow} />
      )}

      <PinPad onPress={handleDigit} onDelete={handleDelete} />

      {/* Biometric button — only shown when enabled and available */}
      {!bioLoading && isEnabled && canUseBiometric && Platform.OS !== 'web' ? (
        <View style={styles.bioSection}>
          <Animated.View style={{ transform: [{ scale: bioButtonScale }] }}>
            <TouchableOpacity
              style={[styles.bioButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={triggerBiometric}
              activeOpacity={0.75}
            >
              <Feather name={biometricIcon as any} size={26} color={colors.primary} />
            </TouchableOpacity>
          </Animated.View>
          <Text style={[styles.bioLabel, { color: colors.mutedForeground }]}>
            {biometricType === 'face' ? 'Face ID' : 'Fingerprint'}
          </Text>
        </View>
      ) : (
        // Spacer to keep layout stable
        <View style={styles.bioSection} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 24,
  },
  logoImg: {
    width: 200,
    height: 100,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  greetSection: {
    alignItems: 'center',
    gap: 8,
  },
  greeting: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 32,
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 24,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  bioSection: {
    alignItems: 'center',
    gap: 8,
    minHeight: 80,
    justifyContent: 'center',
  },
  bioButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bioLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
});
