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
  { name: '9mobile', color: '#059669', bg: '#ECFDF5' },
];

type DataPlan = { label: string; size: string; validity: string; amount: number };

const DATA_PLANS: Record<string, DataPlan[]> = {
  MTN: [
    { label: '500MB', size: '500MB', validity: '7 days', amount: 150 },
    { label: '1GB', size: '1GB', validity: '30 days', amount: 300 },
    { label: '2GB', size: '2GB', validity: '30 days', amount: 500 },
    { label: '5GB', size: '5GB', validity: '30 days', amount: 1500 },
    { label: '10GB', size: '10GB', validity: '30 days', amount: 2500 },
    { label: '20GB', size: '20GB', validity: '30 days', amount: 4000 },
  ],
  Airtel: [
    { label: '750MB', size: '750MB', validity: '7 days', amount: 200 },
    { label: '1.5GB', size: '1.5GB', validity: '30 days', amount: 500 },
    { label: '3GB', size: '3GB', validity: '30 days', amount: 1000 },
    { label: '6GB', size: '6GB', validity: '30 days', amount: 1500 },
    { label: '15GB', size: '15GB', validity: '30 days', amount: 3000 },
    { label: '25GB', size: '25GB', validity: '30 days', amount: 5000 },
  ],
  Glo: [
    { label: '1GB', size: '1GB', validity: '7 days', amount: 200 },
    { label: '2.5GB', size: '2.5GB', validity: '30 days', amount: 500 },
    { label: '5GB', size: '5GB', validity: '30 days', amount: 1000 },
    { label: '7.5GB', size: '7.5GB', validity: '30 days', amount: 1500 },
    { label: '15GB', size: '15GB', validity: '30 days', amount: 2000 },
    { label: '30GB', size: '30GB', validity: '30 days', amount: 4500 },
  ],
  '9mobile': [
    { label: '500MB', size: '500MB', validity: '7 days', amount: 100 },
    { label: '1GB', size: '1GB', validity: '30 days', amount: 200 },
    { label: '2GB', size: '2GB', validity: '30 days', amount: 500 },
    { label: '5GB', size: '5GB', validity: '30 days', amount: 1200 },
    { label: '11GB', size: '11GB', validity: '30 days', amount: 2000 },
    { label: '22GB', size: '22GB', validity: '30 days', amount: 3500 },
  ],
};

export default function DataScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { balance, buyData } = useWallet();

  const [network, setNetwork] = useState('MTN');
  const [phone, setPhone] = useState(user?.phone?.replace('+234 ', '0').replace(/ /g, '') ?? '');
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const plans = DATA_PLANS[network] ?? [];

  const handleNetworkChange = (name: string) => {
    setNetwork(name);
    setSelectedPlan(null);
  };

  const handleBuy = async () => {
    if (!selectedPlan) return;
    if (selectedPlan.amount > balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds.');
      return;
    }
    if (phone.length < 11) {
      Alert.alert('Invalid Phone', 'Enter a valid 11-digit phone number.');
      return;
    }
    setLoading(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(r => setTimeout(r, 1000));
    const ok = await buyData(phone, network, selectedPlan.size, selectedPlan.amount);
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
        <Text style={[styles.title, { color: colors.foreground }]}>Buy Data</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Select Network</Text>
        <View style={styles.networkRow}>
          {NETWORKS.map(net => (
            <TouchableOpacity
              key={net.name}
              style={[
                styles.netChip,
                {
                  backgroundColor: net.bg,
                  borderColor: network === net.name ? net.color : 'transparent',
                  borderWidth: 2,
                },
              ]}
              onPress={() => handleNetworkChange(net.name)}
              activeOpacity={0.7}
            >
              <Text style={[styles.netText, { color: net.color }]}>{net.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>Phone Number</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.foreground }]}
          value={phone}
          onChangeText={t => setPhone(t.replace(/\D/g, '').slice(0, 11))}
          keyboardType="phone-pad"
          placeholder="08012345678"
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 20 }]}>Select Data Plan</Text>
        <View style={styles.plansGrid}>
          {plans.map((plan, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.planCard,
                {
                  backgroundColor: selectedPlan?.label === plan.label ? colors.primary : colors.card,
                  borderColor: selectedPlan?.label === plan.label ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedPlan(plan)}
              activeOpacity={0.7}
            >
              <Text style={[styles.planSize, { color: selectedPlan?.label === plan.label ? '#fff' : colors.foreground }]}>
                {plan.size}
              </Text>
              <Text style={[styles.planValidity, { color: selectedPlan?.label === plan.label ? 'rgba(255,255,255,0.8)' : colors.mutedForeground }]}>
                {plan.validity}
              </Text>
              <Text style={[styles.planAmount, { color: selectedPlan?.label === plan.label ? '#fff' : colors.primary }]}>
                ₦{plan.amount.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.buyBtn,
            { backgroundColor: selectedPlan && phone.length >= 11 ? colors.primary : colors.border },
          ]}
          onPress={handleBuy}
          disabled={!selectedPlan || phone.length < 11 || loading}
          activeOpacity={0.8}
        >
          <Text style={[styles.buyBtnText, { color: selectedPlan && phone.length >= 11 ? '#fff' : colors.mutedForeground }]}>
            {loading ? 'Processing...' : selectedPlan ? `Buy ${selectedPlan.size} for ₦${selectedPlan.amount.toLocaleString()}` : 'Select a Plan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={success} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <Feather name="check-circle" size={52} color="#10B981" />
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Data Activated!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              {selectedPlan?.size} {network} data bundle sent to {phone}
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
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  planCard: {
    width: '30%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  planSize: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  planValidity: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
  },
  planAmount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginTop: 4,
  },
  buyBtn: {
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    marginTop: 20,
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
