export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

export function useBiometric() {
  return {
    isSupported: false,
    isEnrolled: false,
    biometricType: 'none' as BiometricType,
    isEnabled: false,
    isLoading: false,
    canUseBiometric: false,
    setEnabled: async (_val: boolean) => {},
    authenticate: async () => false,
  };
}
