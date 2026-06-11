import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
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
import { useWallet } from '@/context/WalletContext';
import { useColors } from '@/hooks/useColors';

const NETWORKS = [
  { name: 'MTN', color: '#FFB800', bg: '#FFFBEB' },
  { name: 'Airtel', color: '#DC2626', bg: '#FEF2F2' },
  { name: 'Glo', color: '#16A34A', bg: '#F0FDF4' },
  { name: '9mobile', color: '#16A34A', bg: '#ECFDF5' },
];

const PRESETS = [100, 200, 500, 1000, 2000, 5000];

export default function AirtimeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { balance, buyAirtime } = useWallet();

  const [network, setNetwork] = useState('MTN');
  const [phone, setPhone] = useState(user?.phone?.replace('+234 ', '0').replace(/ /g, '') ?? '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleBuy = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 50) {
      Alert.alert('Invalid Amount', 'Minimum airtime purchase is ₦50.');
      return;
    }
    if (amt > balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds.');
      return;
    }
    if (phone.length < 11) {
      Alert.alert('Invalid Phone', 'Please enter a valid 11-digit phone number.');
      return;
    }
    setLoading(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(r => setTimeout(r, 1000));
    const ok = await buyAirtime(phone, network, amt);
    setLoading(false);
    if (ok) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    }
  };

  const selectedNet = NETWORKS.find(n => n.name === network)!;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Buy Airtime</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Network Selection */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Select Network</Text>
        <View style={styles.networkRow}>
          {NETWORKS.map(net => (
            <TouchableOpacity
              key={net.name}
              style={[
                styles.netChip,
                { backgroundColor: net.bg, borderColor: network === net.name ? net.color : 'transparent', borderWidth: 2 },
              ]}
              onPress={() => setNetwork(net.name)}
              activeOpacity={0.7}
            >
              <Text style={[styles.netText, { color: net.color }]}>{net.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Phone Number */}
        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>Phone Number</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.foreground }]}
          value={phone}
          onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 11))}
          keyboardType="phone-pad"
          placeholder="08012345678"
          placeholderTextColor={colors.mutedForeground}
        />

        {/* Amount */}
        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>Amount (₦)</Text>
        <View style={styles.presetGrid}>
          {PRESETS.map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.preset,
                {
                  backgroundColor: amount === String(p) ? colors.primary : colors.card,
                  borderColor: amount === String(p) ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setAmount(String(p))}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, { color: amount === String(p) ? '#fff' : colors.foreground }]}>
                ₦{p.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.foreground, marginTop: 10 }]}
          value={amount}
          onChangeText={t => setAmount(t.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          placeholder="Or enter custom amount"
          placeholderTextColor={colors.mutedForeground}
        />

        {/* Summary */}
        {!!amount && parseFloat(amount) > 0 && (
          <View style={[styles.summary, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.summaryText, { color: colors.secondaryForeground }]}>
              {network} ₦{parseFloat(amount).toLocaleString()} airtime for {phone}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.buyBtn, { backgroundColor: !!amount && !!phone ? colors.primary : colors.border }]}
          onPress={handleBuy}
          disabled={!amount || !phone || loading}
          activeOpacity={0.8}
        >
          <Text style={[styles.buyBtnText, { color: !!amount && !!phone ? '#fff' : colors.mutedForeground }]}>
            {loading ? 'Processing...' : 'Buy Airtime'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={success} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <Feather name="check-circle" size={52} color="#10B981" />
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Airtime Sent!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              ₦{parseFloat(amount || '0').toLocaleString()} {network} airtime delivered to {phone}
            </Text>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => { setSuccess(false); router.back(); }}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  networkRow: {
    flexDirection: 'row',
    gap: 10,
  },
  netChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  netText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  preset: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  summary: {
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  summaryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    textAlign: 'center',
  },
  buyBtn: {
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    marginTop: 16,
  },
  buyBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  successTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
  },
  successSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  doneBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginTop: 8,
  },
  doneBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});
