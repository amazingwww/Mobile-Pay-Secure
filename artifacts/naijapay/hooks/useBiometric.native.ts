import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const BIOMETRIC_PREF_KEY = '@guudees_biometric_enabled';

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

function getBiometricLabel(types: LocalAuthentication.AuthenticationType[]): BiometricType {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'face';
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'iris';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
  return 'none';
}

export function useBiometric() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    if (Platform.OS === 'web') {
      setIsLoading(false);
      return;
    }
    try {
      const [hardware, enrolled, types, prefRaw] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        AsyncStorage.getItem(BIOMETRIC_PREF_KEY),
      ]);
      setIsSupported(hardware);
      setIsEnrolled(enrolled);
      setBiometricType(getBiometricLabel(types));
      setIsEnabled(prefRaw === 'true' && hardware && enrolled);
    } catch {
      // silently fail — biometric is optional
    } finally {
      setIsLoading(false);
    }
  };

  const setEnabled = useCallback(async (val: boolean) => {
    await AsyncStorage.setItem(BIOMETRIC_PREF_KEY, val ? 'true' : 'false');
    setIsEnabled(val);
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    if (!isSupported || !isEnrolled) return false;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Log in to Guudees',
        cancelLabel: 'Use PIN instead',
        disableDeviceFallback: false,
        fallbackLabel: 'Use PIN',
      });
      return result.success;
    } catch {
      return false;
    }
  }, [isSupported, isEnrolled]);

  const canUseBiometric = isSupported && isEnrolled;

  return {
    isSupported,
    isEnrolled,
    biometricType,
    isEnabled,
    isLoading,
    canUseBiometric,
    setEnabled,
    authenticate,
  };
}
