import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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

const BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'GTBank', code: '058' },
  { name: 'First Bank', code: '011' },
  { name: 'UBA', code: '033' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Kuda Bank', code: '090267' },
  { name: 'NaijaPay MFB', code: '999' },
  { name: 'Opay', code: '304' },
];

const FAKE_NAMES: Record<string, string> = {
  '0987654321': 'CHUKWUEMEKA NWOSU',
  '1122334455': 'FATIMAH ABUBAKAR',
  '2233445566': 'OLUMIDE BADMUS',
};

function fakeVerify(acct: string): string {
  if (FAKE_NAMES[acct]) return FAKE_NAMES[acct];
  if (acct.length === 10) {
    const names = ['EMEKA JOHNSON', 'BLESSING OKAFOR', 'IBRAHIM MUSA', 'CHIOMA EZE', 'TUNDE ADEYEMI'];
    const idx = parseInt(acct.slice(-1)) % names.length;
    return names[idx];
  }
  return '';
}

function formatAmount(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SendScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { balance, beneficiaries, sendMoney, addBeneficiary } = useWallet();

  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleAccountChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(digits);
    setVerifiedName('');
    if (digits.length === 10) {
      setIsVerifying(true);
      setTimeout(() => {
        const name = fakeVerify(digits);
        setVerifiedName(name);
        setIsVerifying(false);
      }, 800);
    }
  };

  const handleBeneficiarySelect = (b: typeof beneficiaries[0]) => {
    const bank = BANKS.find(bk => bk.code === b.bankCode);
    setSelectedBank(b.bankCode);
    setAccountNumber(b.accountNumber);
    setVerifiedName(b.accountName ?? b.name.toUpperCase());
  };

  const handleSend = async () => {
    const amt = parseFloat(amount.replace(/,/g, ''));
    if (!amt || amt <= 0) return;
    if (amt > balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds for this transfer.');
      return;
    }
    setIsSending(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await new Promise(r => setTimeout(r, 1200));
    const ok = await sendMoney(amt, verifiedName, narration || `Transfer to ${verifiedName}`);
    setIsSending(false);
    if (ok) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setSuccessModal(true);
    } else {
      Alert.alert('Transfer Failed', 'Unable to complete this transfer. Please try again.');
    }
  };

  const handleReset = () => {
    setSuccessModal(false);
    setAccountNumber('');
    setVerifiedName('');
    setAmount('');
    setNarration('');
    setSelectedBank('');
  };

  const bankName = BANKS.find(b => b.code === selectedBank)?.name ?? '';
  const canSend = !!verifiedName && !!selectedBank && parseFloat(amount || '0') > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Send Money</Text>
        <Text style={[styles.balance, { color: colors.mutedForeground }]}>
          Balance: <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>₦{formatAmount(balance)}</Text>
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: (Platform.OS === 'web' ? 120 : insets.bottom + 100) }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Beneficiaries */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Saved Beneficiaries</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.beneScroll} contentContainerStyle={{ gap: 12, paddingRight: 8 }}>
          {beneficiaries.map(b => (
            <TouchableOpacity
              key={b.id}
              style={[styles.beneChip, { backgroundColor: colors.card }]}
              onPress={() => handleBeneficiarySelect(b)}
              activeOpacity={0.7}
            >
              <View style={[styles.beneAvatar, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.beneInitial, { color: colors.primary }]}>
                  {b.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.beneName, { color: colors.foreground }]} numberOfLines={1}>
                {b.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bank Selector */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Bank</Text>
          <TouchableOpacity
            style={[styles.picker, { borderColor: colors.border }]}
            onPress={() => setShowBankPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pickerText, { color: selectedBank ? colors.foreground : colors.mutedForeground }]}>
              {bankName || 'Select bank'}
            </Text>
            <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Account Number</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input }]}
            value={accountNumber}
            onChangeText={handleAccountChange}
            keyboardType="numeric"
            maxLength={10}
            placeholder="Enter 10-digit account number"
            placeholderTextColor={colors.mutedForeground}
          />

          {isVerifying && (
            <Text style={[styles.verifyText, { color: colors.mutedForeground }]}>Verifying account...</Text>
          )}
          {verifiedName ? (
            <View style={styles.verifiedRow}>
              <Feather name="check-circle" size={16} color="#10B981" />
              <Text style={[styles.verifiedName, { color: '#10B981' }]}>{verifiedName}</Text>
            </View>
          ) : null}

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Amount (₦)</Text>
          <View style={[styles.amountRow, { borderColor: colors.border, backgroundColor: colors.input }]}>
            <Text style={[styles.naira, { color: colors.foreground }]}>₦</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.foreground }]}
              value={amount}
              onChangeText={t => setAmount(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Narration (optional)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input }]}
            value={narration}
            onChangeText={setNarration}
            placeholder="What's this for?"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="done"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: canSend ? colors.primary : colors.border },
          ]}
          onPress={handleSend}
          disabled={!canSend || isSending}
          activeOpacity={0.8}
        >
          <Text style={[styles.sendBtnText, { color: canSend ? '#fff' : colors.mutedForeground }]}>
            {isSending ? 'Processing...' : 'Send Money'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bank Picker Modal */}
      <Modal visible={showBankPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Bank</Text>
            <ScrollView>
              {BANKS.map(b => (
                <TouchableOpacity
                  key={b.code}
                  style={[styles.bankRow, { borderBottomColor: colors.border }]}
                  onPress={() => { setSelectedBank(b.code); setShowBankPicker(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.bankRowName, { color: colors.foreground }]}>{b.name}</Text>
                  {selectedBank === b.code && <Feather name="check" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setShowBankPicker(false)}>
              <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={successModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.successSheet, { backgroundColor: colors.card }]}>
            <View style={styles.successIcon}>
              <Feather name="check-circle" size={48} color="#10B981" />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Transfer Successful</Text>
            <Text style={[styles.successAmt, { color: colors.primary }]}>
              ₦{parseFloat(amount || '0').toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
              Sent to {verifiedName}
            </Text>
            <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={handleReset} activeOpacity={0.8}>
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
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    letterSpacing: -0.3,
  },
  balance: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 4,
  },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginBottom: 10,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  beneScroll: {
    marginBottom: 20,
  },
  beneChip: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 8,
    minWidth: 72,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  beneAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beneInitial: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  beneName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  pickerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  verifyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 8,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  verifiedName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  naira: {
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    padding: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
  },
  sendBtn: {
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
  },
  sendBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  bankRowName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  successSheet: {
    borderRadius: 24,
    padding: 32,
    margin: 24,
    alignItems: 'center',
    gap: 12,
  },
  successIcon: {
    marginBottom: 8,
  },
  successTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  successAmt: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    letterSpacing: -1,
  },
  successSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
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
