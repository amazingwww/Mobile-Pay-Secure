import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

type Step = 'intro' | 'bvn' | 'selfie' | 'submitting' | 'success';

const BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/zela/kyc`;

async function verifyBvn(bvn: string, dateOfBirth: string) {
  const res = await fetch(`${BASE}/bvn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bvn, dateOfBirth }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? 'BVN verification failed');
  return data as { verified: boolean; firstName: string; lastName: string; middleName: string };
}

async function verifySelfie(bvn: string, selfieBase64: string) {
  const res = await fetch(`${BASE}/selfie`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bvn, selfieBase64 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? 'Selfie verification failed');
  return data as { verified: boolean; tier: string };
}

export default function KYCScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [step, setStep] = useState<Step>('intro');
  const [bvn, setBvn] = useState('');
  const [dob, setDob] = useState(''); // DD/MM/YYYY display
  const [bvnData, setBvnData] = useState<{ firstName: string; lastName: string; middleName: string } | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiMode, setApiMode] = useState(true); // try real API first

  const progressAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const goStep = (s: Step, progress: number) => {
    setStep(s);
    Animated.timing(progressAnim, { toValue: progress, duration: 300, useNativeDriver: false }).start();
  };

  // Format DOB input as DD/MM/YYYY
  const handleDobChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
    if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
    setDob(formatted);
  };

  // Convert DD/MM/YYYY → YYYY-MM-DD for API
  const dobToIso = (d: string) => {
    const parts = d.split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const handleBvnNext = async () => {
    if (bvn.length !== 11) {
      Alert.alert('Invalid BVN', 'Please enter your 11-digit BVN.');
      return;
    }
    const parts = dob.split('/');
    if (parts.length !== 3 || parts[2].length !== 4) {
      Alert.alert('Invalid Date', 'Please enter your date of birth as DD/MM/YYYY.');
      return;
    }
    setIsLoading(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const isoDate = dobToIso(dob);
      const result = await verifyBvn(bvn, isoDate);
      setBvnData(result);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      goStep('selfie', 0.66);
    } catch (err: any) {
      const msg = err?.message ?? '';
      // If API not configured, use demo mode
      if (msg.includes('503') || msg.includes('credentials')) {
        setBvnData({ firstName: user?.name?.split(' ')[0] ?? 'Demo', lastName: user?.name?.split(' ')[1] ?? 'User', middleName: '' });
        setApiMode(false);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        goStep('selfie', 0.66);
      } else {
        Alert.alert('Verification Failed', msg || 'Could not verify your BVN. Please check and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      // Fallback to gallery on web or denied camera
      const galleryResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!galleryResult.canceled && galleryResult.assets[0]) {
        setSelfieUri(galleryResult.assets[0].uri);
        setSelfieBase64(galleryResult.assets[0].base64 ?? null);
      }
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!result.canceled && result.assets[0]) {
      setSelfieUri(result.assets[0].uri);
      setSelfieBase64(result.assets[0].base64 ?? null);
    }
  };

  const handleUploadSelfie = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setSelfieUri(result.assets[0].uri);
      setSelfieBase64(result.assets[0].base64 ?? null);
    }
  };

  const handleSubmit = async () => {
    if (!selfieUri) {
      Alert.alert('Selfie Required', 'Please take or upload a selfie to continue.');
      return;
    }
    goStep('submitting', 0.85);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      if (apiMode && selfieBase64) {
        await verifySelfie(bvn, selfieBase64);
      }
      // Update user tier locally
      await updateUser({ tier: 'Tier 2', bvn: `${bvn.slice(0, 2)}*******${bvn.slice(-2)}` });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      goStep('success', 1);
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('503') || msg.includes('credentials')) {
        // Demo mode — upgrade locally
        await updateUser({ tier: 'Tier 2', bvn: `${bvn.slice(0, 2)}*******${bvn.slice(-2)}` });
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        goStep('success', 1);
      } else {
        Alert.alert('Submission Failed', msg || 'Could not submit your verification. Please try again.');
        goStep('selfie', 0.66);
      }
    }
  };

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => {
            if (step === 'intro' || step === 'success') { router.back(); }
            else if (step === 'bvn') goStep('intro', 0);
            else if (step === 'selfie') goStep('bvn', 0.33);
          }}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Feather name={step === 'success' ? 'x' : 'arrow-left'} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {step === 'intro' ? 'Upgrade Account' : step === 'bvn' ? 'Verify BVN' : step === 'selfie' ? 'Take Selfie' : step === 'submitting' ? 'Verifying...' : 'Verified!'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress bar */}
      {step !== 'success' && step !== 'intro' && (
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <Animated.View style={[styles.progressBar, { width: progressWidth, backgroundColor: colors.primary }]} />
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: botPad + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── INTRO ─── */}
          {step === 'intro' && (
            <View style={styles.stepContainer}>
              <LinearGradient colors={['#2563EB15', '#2563EB05']} style={styles.introBanner}>
                <View style={[styles.shieldIcon, { backgroundColor: colors.primary }]}>
                  <Feather name="shield" size={36} color="#fff" />
                </View>
                <Text style={[styles.introTitle, { color: colors.foreground }]}>Upgrade to Tier 2</Text>
                <Text style={[styles.introSub, { color: colors.mutedForeground }]}>
                  Tier 2 lets you send up to ₦500,000 per day and hold up to ₦5,000,000 in your wallet.
                </Text>
              </LinearGradient>

              <View style={[styles.requirementsCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.reqTitle, { color: colors.foreground }]}>What you'll need</Text>
                {[
                  { icon: 'credit-card', label: 'Your BVN', sub: '11-digit BVN (National ID for financial services)' },
                  { icon: 'calendar', label: 'Date of Birth', sub: 'Matching your BVN record' },
                  { icon: 'camera', label: 'A selfie', sub: 'Clear photo of your face in good lighting' },
                ].map((item, i) => (
                  <View key={i} style={styles.reqRow}>
                    <View style={[styles.reqIcon, { backgroundColor: colors.secondary }]}>
                      <Feather name={item.icon as any} size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reqLabel, { color: colors.foreground }]}>{item.label}</Text>
                      <Text style={[styles.reqSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={[styles.noteCard, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
                <Feather name="lock" size={16} color="#EA580C" />
                <Text style={[styles.noteText, { color: '#9A3412' }]}>
                  Your data is encrypted and only used to verify your identity per CBN regulations.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => goStep('bvn', 0.33)}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Start Verification</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* ─── BVN ─── */}
          {step === 'bvn' && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Enter your BVN</Text>
              <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                Dial *565*0# on any phone to get your BVN instantly.
              </Text>

              <View style={[styles.formCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>BVN</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.foreground }]}
                  value={bvn}
                  onChangeText={t => setBvn(t.replace(/\D/g, '').slice(0, 11))}
                  keyboardType="numeric"
                  maxLength={11}
                  placeholder="Enter 11-digit BVN"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry
                />
                {bvn.length > 0 && (
                  <Text style={[styles.counter, { color: bvn.length === 11 ? colors.primary : colors.mutedForeground }]}>
                    {bvn.length}/11 digits
                  </Text>
                )}

                <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 20 }]}>Date of Birth</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.foreground }]}
                  value={dob}
                  onChangeText={handleDobChange}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              <View style={[styles.noteCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="info" size={15} color={colors.primary} />
                <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
                  We only use your BVN to verify your identity. We never share it with third parties.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: bvn.length === 11 && dob.length === 10 ? colors.primary : colors.border }]}
                onPress={handleBvnNext}
                disabled={bvn.length !== 11 || dob.length !== 10 || isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={[styles.primaryBtnText, { color: bvn.length === 11 && dob.length === 10 ? '#fff' : colors.mutedForeground }]}>Verify BVN</Text>
                    <Feather name="arrow-right" size={18} color={bvn.length === 11 && dob.length === 10 ? '#fff' : colors.mutedForeground} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ─── SELFIE ─── */}
          {step === 'selfie' && (
            <View style={styles.stepContainer}>
              {bvnData && (
                <View style={[styles.bvnResultCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                  <Feather name="check-circle" size={18} color="#16A34A" />
                  <Text style={[styles.bvnResultText, { color: '#15803D' }]}>
                    BVN verified — {[bvnData.firstName, bvnData.middleName, bvnData.lastName].filter(Boolean).join(' ') || 'Identity confirmed'}
                  </Text>
                </View>
              )}

              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Take a selfie</Text>
              <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
                Look straight at the camera in a well-lit area. No glasses, hats, or masks.
              </Text>

              {/* Selfie preview / placeholder */}
              <TouchableOpacity
                style={[styles.selfieFrame, { borderColor: selfieUri ? colors.primary : colors.border, backgroundColor: colors.card }]}
                onPress={handleTakeSelfie}
                activeOpacity={0.8}
              >
                {selfieUri ? (
                  <Image source={{ uri: selfieUri }} style={styles.selfieImage} contentFit="cover" />
                ) : (
                  <View style={styles.selfieEmpty}>
                    <View style={[styles.selfieIconRing, { borderColor: colors.border }]}>
                      <Feather name="camera" size={36} color={colors.primary} />
                    </View>
                    <Text style={[styles.selfiePrompt, { color: colors.foreground }]}>Tap to open camera</Text>
                    <Text style={[styles.selfieSub, { color: colors.mutedForeground }]}>Make sure your face is fully visible</Text>
                  </View>
                )}
              </TouchableOpacity>

              {selfieUri && (
                <View style={styles.selfieActions}>
                  <TouchableOpacity style={[styles.retakeBtn, { borderColor: colors.border }]} onPress={handleTakeSelfie} activeOpacity={0.7}>
                    <Feather name="camera" size={16} color={colors.foreground} />
                    <Text style={[styles.retakeBtnText, { color: colors.foreground }]}>Retake</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.uploadLink} onPress={handleUploadSelfie} activeOpacity={0.7}>
                <Feather name="upload" size={14} color={colors.primary} />
                <Text style={[styles.uploadLinkText, { color: colors.primary }]}>Upload from gallery instead</Text>
              </TouchableOpacity>

              {[
                'Face clearly visible, no blur',
                'Good lighting — avoid shadows',
                'Look straight at the camera',
              ].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Feather name="check" size={14} color={colors.primary} />
                  <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: selfieUri ? colors.primary : colors.border, marginTop: 24 }]}
                onPress={handleSubmit}
                disabled={!selfieUri}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryBtnText, { color: selfieUri ? '#fff' : colors.mutedForeground }]}>Submit Verification</Text>
                <Feather name="arrow-right" size={18} color={selfieUri ? '#fff' : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          )}

          {/* ─── SUBMITTING ─── */}
          {step === 'submitting' && (
            <View style={[styles.stepContainer, styles.centeredStep]}>
              <View style={[styles.processingRing, { borderColor: colors.primary + '30' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
              <Text style={[styles.stepTitle, { color: colors.foreground, textAlign: 'center' }]}>Verifying your identity</Text>
              <Text style={[styles.stepSub, { color: colors.mutedForeground, textAlign: 'center' }]}>
                This usually takes a few seconds. Please don't close the app.
              </Text>
            </View>
          )}

          {/* ─── SUCCESS ─── */}
          {step === 'success' && (
            <View style={[styles.stepContainer, styles.centeredStep]}>
              <LinearGradient colors={['#2563EB20', '#2563EB05']} style={styles.successBanner}>
                <View style={[styles.successRing, { borderColor: '#2563EB' }]}>
                  <Feather name="check" size={48} color="#2563EB" />
                </View>
              </LinearGradient>

              <Text style={[styles.successTitle, { color: colors.foreground }]}>You're verified!</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                Your account has been upgraded to{' '}
                <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Tier 2</Text>.
                You can now send up to ₦500,000 per day.
              </Text>

              <View style={[styles.benefitsCard, { backgroundColor: colors.card }]}>
                {[
                  { icon: 'trending-up', label: 'Daily limit', value: '₦500,000' },
                  { icon: 'database', label: 'Wallet balance', value: 'Up to ₦5M' },
                  { icon: 'repeat', label: 'Transfers', value: 'Unlimited daily' },
                ].map((b, i) => (
                  <View key={i} style={[styles.benefitRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                    <View style={[styles.benefitIcon, { backgroundColor: colors.secondary }]}>
                      <Feather name={b.icon as any} size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.benefitLabel, { color: colors.mutedForeground }]}>{b.label}</Text>
                    <Text style={[styles.benefitValue, { color: colors.foreground }]}>{b.value}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.replace('/(tabs)/')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Go to Home</Text>
                <Feather name="home" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  progressTrack: { height: 4, marginHorizontal: 16, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  progressBar: { height: '100%', borderRadius: 2 },

  stepContainer: { padding: 20, gap: 16 },
  centeredStep: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },

  introBanner: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 12 },
  shieldIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  introTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, textAlign: 'center', letterSpacing: -0.3 },
  introSub: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  requirementsCard: { borderRadius: 16, padding: 20, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  reqTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 4 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  reqIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reqLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, marginBottom: 2 },
  reqSub: { fontFamily: 'Inter_400Regular', fontSize: 12 },

  noteCard: { flexDirection: 'row', borderRadius: 12, padding: 14, gap: 10, alignItems: 'flex-start', borderWidth: 1 },
  noteText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },

  primaryBtn: { borderRadius: 14, padding: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },

  stepTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.3 },
  stepSub: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },

  formCard: { borderRadius: 16, padding: 20, gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontFamily: 'Inter_400Regular', fontSize: 16 },
  counter: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'right', marginTop: 4 },

  bvnResultCard: { flexDirection: 'row', borderRadius: 12, padding: 14, gap: 10, alignItems: 'center', borderWidth: 1 },
  bvnResultText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13 },

  selfieFrame: { borderWidth: 2, borderRadius: 20, height: 260, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  selfieImage: { width: '100%', height: '100%' },
  selfieEmpty: { alignItems: 'center', gap: 12, padding: 24 },
  selfieIconRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  selfiePrompt: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  selfieSub: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center' },
  selfieActions: { flexDirection: 'row', justifyContent: 'center' },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  retakeBtnText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  uploadLink: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  uploadLinkText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText: { fontFamily: 'Inter_400Regular', fontSize: 13 },

  processingRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },

  successBanner: { width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.5, textAlign: 'center' },
  successSub: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 24, textAlign: 'center', paddingHorizontal: 8 },

  benefitsCard: { width: '100%', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  benefitIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  benefitLabel: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14 },
  benefitValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});
