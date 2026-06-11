import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
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
import { useWallet } from '@/context/WalletContext';
import { useColors } from '@/hooks/useColors';

const ELECTRICITY_DISCOS = [
  'Ikeja Electric (IKEDC)',
  'Eko Electricity (EKEDC)',
  'Abuja Electricity (AEDC)',
  'Ibadan Electricity (IBEDC)',
  'Enugu Electricity (EEDC)',
  'Kano Electricity (KEDCO)',
  'Port Harcourt Electricity (PHED)',
  'Benin Electricity (BEDC)',
];

const CABLE_PROVIDERS = [
  { name: 'DSTV', plans: ['Padi - ₦1,850', 'Yanga - ₦2,950', 'Confam - ₦5,300', 'Compact - ₦9,900', 'Compact Plus - ₦14,750', 'Premium - ₦24,500'] },
  { name: 'GOtv', plans: ['Lite - ₦410', 'Jinja - ₦1,640', 'Jolli - ₦2,460', 'Max - ₦4,150'] },
  { name: 'StarTimes', plans: ['Nova - ₦900', 'Basic - ₦1,700', 'Smart - ₦2,200', 'Classic - ₦2,500', 'Super - ₦3,500'] },
];

export default function BillPaymentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type: string }>();
  const { balance, payBill } = useWallet();

  const isElectricity = type === 'electricity';
  const isCable = type === 'cable';

  const [disco, setDisco] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');

  const [cableProvider, setCableProvider] = useState('');
  const [smartCardNumber, setSmartCardNumber] = useState('');
  const [cablePlan, setCablePlan] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const selectedProvider = CABLE_PROVIDERS.find(p => p.name === cableProvider);

  const getPlanAmount = (planStr: string): number => {
    const match = planStr.match(/₦([\d,]+)/);
    if (match) return parseInt(match[1].replace(',', ''));
    return 0;
  };

  const handlePay = async () => {
    let billAmount = 0;
    let ref = '';
    let billType = '';

    if (isElectricity) {
      billAmount = parseFloat(amount);
      ref = meterNumber;
      billType = disco || 'Electricity';
    } else {
      billAmount = getPlanAmount(cablePlan);
      ref = smartCardNumber;
      billType = `${cableProvider} - ${cablePlan.split(' - ')[0]}`;
    }

    if (!billAmount || billAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (billAmount > balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds.');
      return;
    }

    setLoading(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(r => setTimeout(r, 1000));
    const ok = await payBill(billType, ref, billAmount);
    setLoading(false);
    if (ok) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    }
  };

  const canPay = isElectricity
    ? !!disco && !!meterNumber && parseFloat(amount || '0') >= 100
    : !!cableProvider && !!smartCardNumber && !!cablePlan;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isElectricity ? 'Electricity Bill' : 'Cable TV'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isElectricity && (
          <>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Select DISCO</Text>
            {ELECTRICITY_DISCOS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.optionRow, {
                  backgroundColor: disco === d ? colors.secondary : colors.card,
                  borderColor: disco === d ? colors.primary : colors.border,
                }]}
                onPress={() => setDisco(d)}
                activeOpacity={0.7}
              >
                <Feather name="zap" size={16} color={disco === d ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.optionText, { color: disco === d ? colors.primary : colors.foreground }]}>{d}</Text>
                {disco === d && <Feather name="check" size={16} color={colors.primary} />}
              </TouchableOpacity>
            ))}

            <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>Meter Type</Text>
            <View style={styles.toggleRow}>
              {(['prepaid', 'postpaid'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.toggleBtn, {
                    backgroundColor: meterType === t ? colors.primary : colors.card,
                    borderColor: meterType === t ? colors.primary : colors.border,
                  }]}
                  onPress={() => setMeterType(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toggleText, { color: meterType === t ? '#fff' : colors.foreground }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>Meter Number</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.foreground }]}
              value={meterNumber}
              onChangeText={t => setMeterNumber(t.replace(/\D/g, ''))}
              keyboardType="numeric"
              placeholder="Enter meter number"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>Amount (₦)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.foreground }]}
              value={amount}
              onChangeText={t => setAmount(t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="Minimum ₦100"
              placeholderTextColor={colors.mutedForeground}
            />
          </>
        )}

        {isCable && (
          <>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Select Provider</Text>
            <View style={styles.providerRow}>
              {CABLE_PROVIDERS.map(p => (
                <TouchableOpacity
                  key={p.name}
                  style={[styles.providerChip, {
                    backgroundColor: cableProvider === p.name ? colors.primary : colors.card,
                    borderColor: cableProvider === p.name ? colors.primary : colors.border,
                  }]}
                  onPress={() => { setCableProvider(p.name); setCablePlan(''); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.providerText, { color: cableProvider === p.name ? '#fff' : colors.foreground }]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>Smart Card Number</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.foreground }]}
              value={smartCardNumber}
              onChangeText={t => setSmartCardNumber(t.replace(/\D/g, ''))}
              keyboardType="numeric"
              placeholder="Enter smart card number"
              placeholderTextColor={colors.mutedForeground}
            />

            {cableProvider && selectedProvider && (
              <>
                <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>Select Plan</Text>
                {selectedProvider.plans.map(plan => (
                  <TouchableOpacity
                    key={plan}
                    style={[styles.optionRow, {
                      backgroundColor: cablePlan === plan ? colors.secondary : colors.card,
                      borderColor: cablePlan === plan ? colors.primary : colors.border,
                    }]}
                    onPress={() => setCablePlan(plan)}
                    activeOpacity={0.7}
                  >
                    <Feather name="tv" size={16} color={cablePlan === plan ? colors.primary : colors.mutedForeground} />
                    <Text style={[styles.optionText, { color: cablePlan === plan ? colors.primary : colors.foreground, flex: 1 }]}>{plan}</Text>
                    {cablePlan === plan && <Feather name="check" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.payBtn, { backgroundColor: canPay ? colors.primary : colors.border }]}
          onPress={handlePay}
          disabled={!canPay || loading}
          activeOpacity={0.8}
        >
          <Text style={[styles.payBtnText, { color: canPay ? '#fff' : colors.mutedForeground }]}>
            {loading ? 'Processing...' : 'Pay Now'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={success} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <Feather name="check-circle" size={52} color="#10B981" />
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Payment Successful</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              {isElectricity ? `Token will be sent to your registered number` : `${cableProvider} subscription renewed`}
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
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
    gap: 10,
  },
  optionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  toggleText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  providerChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  providerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  payBtn: {
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    marginTop: 20,
  },
  payBtnText: {
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
