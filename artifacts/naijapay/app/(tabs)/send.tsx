import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '@/context/WalletContext';
import { useColors } from '@/hooks/useColors';
import { api } from '@/lib/api';

function formatAmount(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SendScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { balance, beneficiaries, sendMoney, addBeneficiary, verifyAccount, apiReady } = useWallet();

  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [successRef, setSuccessRef] = useState('');
  const [saveBene, setSaveBene] = useState(false);

  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return banks;
    const q = bankSearch.toLowerCase();
    return banks.filter(b => b.name.toLowerCase().includes(q));
  }, [banks, bankSearch]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    setBanksLoading(true);
    api.getBanks()
      .then(d => { if (d.banks?.length) setBanks(d.banks); })
      .catch(() => {})
      .finally(() => setBanksLoading(false));
  }, []);

  const handleAccountChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(digits);
    setVerifiedName('');
    if (digits.length === 10 && selectedBank) {
      doVerify(digits, selectedBank);
    }
  };

  const doVerify = async (acct: string, bankCode: string) => {
    setIsVerifying(true);
    try {
      const name = await verifyAccount(acct, bankCode);
      setVerifiedName(name);
    } catch {
      setVerifiedName('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBankSelect = (code: string) => {
    setSelectedBank(code);
    setShowBankPicker(false);
    setBankSearch('');
    setVerifiedName('');
    if (accountNumber.length === 10) {
      doVerify(accountNumber, code);
    }
  };

  const handleOpenBankPicker = () => {
    setBankSearch('');
    setShowBankPicker(true);
  };

  const handleBeneficiarySelect = (b: typeof beneficiaries[0]) => {
    setSelectedBank(b.bankCode);
    setAccountNumber(b.accountNumber);
    setVerifiedName(b.name.toUpperCase());
  };

  const handleSend = async () => {
    const amt = parseFloat(amount.replace(/,/g, ''));
    if (!amt || amt <= 0) return;
    if (amt > balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds for this transfer.');
      return;
    }
    if (!verifiedName) {
      Alert.alert('Verify Account', 'Please verify the recipient account first.');
      return;
    }
    setIsSending(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const bankName = banks.find(b => b.code === selectedBank)?.name ?? '';
    const result = await sendMoney({
      accountNumber,
      bankCode: selectedBank,
      bankName,
      amount: amt,
      narration: narration || `Transfer to ${verifiedName}`,
      recipientName: verifiedName || undefined,
    });

    setIsSending(false);
    if (result.ok) {
      if (saveBene && verifiedName) {
        addBeneficiary({ name: verifiedName, accountNumber, bankName, bankCode: selectedBank });
      }
      setSuccessRef(result.reference ?? '');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessModal(true);
    } else {
      Alert.alert('Transfer Failed', result.error ?? 'Unable to complete this transfer. Please try again.');
    }
  };

  const handleReset = () => {
    setSuccessModal(false);
    setAccountNumber('');
    setVerifiedName('');
    setAmount('');
    setNarration('');
    setSelectedBank('');
    setSaveBene(false);
  };

  const bankName = banks.find(b => b.code === selectedBank)?.name ?? '';
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
        {beneficiaries.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Saved Beneficiaries</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.beneScroll} contentContainerStyle={{ gap: 12, paddingRight: 8 }}>
              {beneficiaries.map(b => (
                <TouchableOpacity key={b.id} style={[styles.beneChip, { backgroundColor: colors.card }]} onPress={() => handleBeneficiarySelect(b)} activeOpacity={0.7}>
                  <View style={[styles.beneAvatar, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.beneInitial, { color: colors.primary }]}>{b.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.beneName, { color: colors.foreground }]} numberOfLines={1}>{b.name.split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Bank + Account */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Provider</Text>
          <TouchableOpacity style={[styles.picker, { borderColor: colors.border }]} onPress={handleOpenBankPicker} activeOpacity={0.7}>
            {banksLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
            ) : null}
            <Text style={[styles.pickerText, { color: selectedBank ? colors.foreground : colors.mutedForeground, flex: 1 }]}>
              {bankName || (banksLoading ? 'Loading banks…' : 'Select bank')}
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
            <View style={styles.verifyRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.verifyText, { color: colors.mutedForeground }]}>Verifying account...</Text>
            </View>
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

          {verifiedName ? (
            <TouchableOpacity style={styles.saveRow} onPress={() => setSaveBene(v => !v)} activeOpacity={0.7}>
              <View style={[styles.checkbox, { borderColor: saveBene ? colors.primary : colors.border, backgroundColor: saveBene ? colors.primary : 'transparent' }]}>
                {saveBene && <Feather name="check" size={12} color="#fff" />}
              </View>
              <Text style={[styles.saveLabel, { color: colors.mutedForeground }]}>Save as beneficiary</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: canSend ? colors.primary : colors.border }]}
          onPress={handleSend}
          disabled={!canSend || isSending}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.sendBtnText, { color: canSend ? '#fff' : colors.mutedForeground }]}>Send Money</Text>
          )}
        </TouchableOpacity>

        {!apiReady && (
          <Text style={[styles.sandboxNote, { color: colors.mutedForeground }]}>
            Demo mode — add Safe Haven credentials to go live
          </Text>
        )}
      </ScrollView>

      {/* Bank Picker Modal */}
      <Modal visible={showBankPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Provider</Text>

            {/* Search bar */}
            <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                value={bankSearch}
                onChangeText={setBankSearch}
                placeholder="Search banks…"
                placeholderTextColor={colors.mutedForeground}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
              {bankSearch.length > 0 && (
                <TouchableOpacity onPress={() => setBankSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {filteredBanks.length === 0 ? (
                <Text style={[styles.emptySearch, { color: colors.mutedForeground }]}>
                  {banksLoading ? 'Loading…' : `No results for "${bankSearch}"`}
                </Text>
              ) : (
                filteredBanks.map(b => (
                  <TouchableOpacity key={b.code} style={[styles.bankRow, { borderBottomColor: colors.border }]} onPress={() => handleBankSelect(b.code)} activeOpacity={0.7}>
                    <Text style={[styles.bankRowName, { color: colors.foreground }]}>{b.name}</Text>
                    {selectedBank === b.code && <Feather name="check" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => { setShowBankPicker(false); setBankSearch(''); }}>
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
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>Sent to {verifiedName}</Text>
            {successRef ? (
              <Text style={[styles.successRef, { color: colors.mutedForeground }]}>Ref: {successRef}</Text>
            ) : null}
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
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.3 },
  balance: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4 },
  sectionLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, marginBottom: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  beneScroll: { marginBottom: 20 },
  beneChip: { alignItems: 'center', padding: 12, borderRadius: 14, gap: 8, minWidth: 72, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  beneAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  beneInitial: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  beneName: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  card: { borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 14 },
  pickerText: { fontFamily: 'Inter_400Regular', fontSize: 15 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontFamily: 'Inter_400Regular', fontSize: 15 },
  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  verifyText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  verifiedName: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  amountRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14 },
  naira: { fontFamily: 'Inter_500Medium', fontSize: 18, marginRight: 4 },
  amountInput: { flex: 1, padding: 14, fontFamily: 'Inter_400Regular', fontSize: 18 },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  saveLabel: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  sendBtn: { borderRadius: 14, padding: 17, alignItems: 'center' },
  sendBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  sandboxNote: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, marginBottom: 12, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontFamily: 'Inter_400Regular', fontSize: 15 },
  emptySearch: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', paddingVertical: 32 },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  bankRowName: { fontFamily: 'Inter_400Regular', fontSize: 15 },
  cancelBtn: { borderWidth: 1, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 16 },
  cancelBtnText: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  successSheet: { borderRadius: 24, padding: 32, margin: 24, alignItems: 'center', gap: 12 },
  successIcon: { marginBottom: 8 },
  successTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  successAmt: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -1 },
  successSub: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center' },
  successRef: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center' },
  doneBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 48, marginTop: 8 },
  doneBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
});
