import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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

import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import {
  GOAL_COLORS,
  GOAL_EMOJIS,
  SavingsGoal,
  useSavings,
} from '@/context/SavingsContext';
import { useWallet } from '@/context/WalletContext';
import { useColors } from '@/hooks/useColors';

function fmt(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseAmount(s: string): number {
  return parseFloat(s.replace(/,/g, '')) || 0;
}

type Sheet =
  | { kind: 'create' }
  | { kind: 'detail'; goal: SavingsGoal }
  | { kind: 'fund'; goal: SavingsGoal }
  | { kind: 'withdraw'; goal: SavingsGoal }
  | null;

export default function SavingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, createGoal, deleteGoal, fundGoal, withdrawGoal, totalSaved } = useSavings();
  const { balance, fundGoalTransfer, creditBalance } = useWallet();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [sheet, setSheet] = useState<Sheet>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🏠');
  const [newTarget, setNewTarget] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newColor, setNewColor] = useState(GOAL_COLORS[0]);
  const [creating, setCreating] = useState(false);

  // Fund/withdraw amount
  const [txAmount, setTxAmount] = useState('');
  const [txLoading, setTxLoading] = useState(false);

  const openCreate = () => {
    setNewName(''); setNewEmoji('🏠'); setNewTarget('');
    setNewDeadline(''); setNewColor(GOAL_COLORS[0]);
    setSheet({ kind: 'create' });
  };

  const handleCreate = async () => {
    const target = parseAmount(newTarget);
    if (!newName.trim()) { Alert.alert('Error', 'Please enter a goal name.'); return; }
    if (target <= 0) { Alert.alert('Error', 'Please enter a valid target amount.'); return; }
    setCreating(true);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createGoal({ name: newName.trim(), emoji: newEmoji, targetAmount: target, deadline: newDeadline || undefined, color: newColor });
    setCreating(false);
    setSheet(null);
  };

  const handleFund = async () => {
    if (sheet?.kind !== 'fund') return;
    const amt = parseAmount(txAmount);
    if (amt <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    if (amt > balance) { Alert.alert('Insufficient Balance', `Your wallet balance is ₦${fmt(balance)}.`); return; }
    setTxLoading(true);
    const result = await fundGoal(sheet.goal.id, amt, fundGoalTransfer);
    setTxLoading(false);
    if (result.ok) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTxAmount('');
      setSheet(null);
      Alert.alert('Funded! 🎉', `₦${fmt(amt)} added to "${sheet.goal.name}".`);
    } else {
      Alert.alert('Failed', result.error ?? 'Could not fund goal. Try again.');
    }
  };

  const handleWithdraw = () => {
    if (sheet?.kind !== 'withdraw') return;
    const amt = parseAmount(txAmount);
    if (amt <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    if (amt > sheet.goal.savedAmount) {
      Alert.alert('Error', `You only have ₦${fmt(sheet.goal.savedAmount)} saved in this goal.`);
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    withdrawGoal(sheet.goal.id, amt, creditBalance);
    setTxAmount('');
    setSheet(null);
    Alert.alert('Withdrawn', `₦${fmt(amt)} returned to your wallet.`);
  };

  const confirmDelete = (goal: SavingsGoal) => {
    Alert.alert(
      'Delete Goal',
      `Delete "${goal.name}"? The ₦${fmt(goal.savedAmount)} saved will be returned to your wallet.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            if (goal.savedAmount > 0) creditBalance(goal.savedAmount, goal.name);
            deleteGoal(goal.id);
            setSheet(null);
          },
        },
      ]
    );
  };

  const openTx = (kind: 'fund' | 'withdraw', goal: SavingsGoal) => {
    setTxAmount('');
    setSheet({ kind, goal });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#00A859', '#007A41']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.headerGrad, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Savings Goals</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Summary */}
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryLabel}>Total Saved</Text>
          <Text style={styles.summaryAmount}>₦{fmt(totalSaved)}</Text>
          <Text style={styles.summaryCount}>{goals.length} active {goals.length === 1 ? 'goal' : 'goals'}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: botPad + 100, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {goals.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No savings goals yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Create your first goal and start saving towards what matters most.
            </Text>
          </View>
        )}

        {goals.map(goal => (
          <SavingsGoalCard
            key={goal.id}
            goal={goal}
            onPress={() => setSheet({ kind: 'detail', goal })}
          />
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: botPad + 20 }]}
        onPress={openCreate}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#00C46C', '#00A859']}
          style={styles.fabGrad}
        >
          <Feather name="plus" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* ── MODALS ── */}

      {/* Create Goal Sheet */}
      <Modal
        visible={sheet?.kind === 'create'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSheet(null)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setSheet(null)}>
                <Text style={[styles.modalCancel, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Goal</Text>
              <TouchableOpacity onPress={handleCreate} disabled={creating}>
                <Text style={[styles.modalSave, { color: colors.primary }]}>Create</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
              {/* Emoji picker */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Icon</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  <View style={styles.emojiRow}>
                    {GOAL_EMOJIS.map(e => (
                      <TouchableOpacity
                        key={e}
                        style={[
                          styles.emojiPick,
                          { backgroundColor: newEmoji === e ? newColor + '30' : colors.card },
                          newEmoji === e && { borderColor: newColor, borderWidth: 2 },
                        ]}
                        onPress={() => setNewEmoji(e)}
                      >
                        <Text style={{ fontSize: 22 }}>{e}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Name */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Goal Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="e.g. Emergency Fund"
                  placeholderTextColor={colors.mutedForeground}
                  value={newName}
                  onChangeText={setNewName}
                  maxLength={40}
                />
              </View>

              {/* Target Amount */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Target Amount (₦)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  value={newTarget}
                  onChangeText={setNewTarget}
                />
              </View>

              {/* Deadline */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Deadline (optional, YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="e.g. 2027-12-31"
                  placeholderTextColor={colors.mutedForeground}
                  value={newDeadline}
                  onChangeText={setNewDeadline}
                />
              </View>

              {/* Color picker */}
              <View style={styles.formSection}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Colour</Text>
                <View style={styles.colorRow}>
                  {GOAL_COLORS.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.colorSwatch, { backgroundColor: c }, newColor === c && styles.colorSwatchSelected]}
                      onPress={() => setNewColor(c)}
                    >
                      {newColor === c && <Feather name="check" size={14} color="#fff" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail Sheet */}
      {sheet?.kind === 'detail' && (
        <Modal
          visible
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSheet(null)}
        >
          <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setSheet(null)}>
                <Text style={[styles.modalCancel, { color: colors.mutedForeground }]}>Close</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{sheet.goal.name}</Text>
              <TouchableOpacity onPress={() => confirmDelete(sheet.goal)}>
                <Feather name="trash-2" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
              <SavingsGoalCard goal={sheet.goal} />

              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.detailBtn, { backgroundColor: sheet.goal.color }]}
                  onPress={() => openTx('fund', sheet.goal)}
                  activeOpacity={0.85}
                >
                  <Feather name="plus-circle" size={18} color="#fff" />
                  <Text style={styles.detailBtnText}>Add Money</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.detailBtnOutline, { borderColor: sheet.goal.color }]}
                  onPress={() => openTx('withdraw', sheet.goal)}
                  activeOpacity={0.85}
                >
                  <Feather name="minus-circle" size={18} color={sheet.goal.color} />
                  <Text style={[styles.detailBtnOutlineText, { color: sheet.goal.color }]}>Withdraw</Text>
                </TouchableOpacity>
              </View>

              {/* Info rows */}
              <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                {[
                  { label: 'Created', value: new Date(sheet.goal.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  { label: 'Deadline', value: sheet.goal.deadline ? new Date(sheet.goal.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No deadline' },
                  { label: 'Saved', value: `₦${fmt(sheet.goal.savedAmount)}` },
                  { label: 'Remaining', value: `₦${fmt(Math.max(0, sheet.goal.targetAmount - sheet.goal.savedAmount))}` },
                  { label: 'Target', value: `₦${fmt(sheet.goal.targetAmount)}` },
                ].map((row, i) => (
                  <View key={i} style={[styles.infoRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Fund / Withdraw Sheet */}
      {(sheet?.kind === 'fund' || sheet?.kind === 'withdraw') && (
        <Modal
          visible
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSheet(null)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setSheet(null)}>
                  <Text style={[styles.modalCancel, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {sheet.kind === 'fund' ? 'Add Money' : 'Withdraw'}
                </Text>
                <View style={{ width: 56 }} />
              </View>

              <View style={{ padding: 24, gap: 24 }}>
                {/* Goal header */}
                <View style={styles.txGoalRow}>
                  <View style={[styles.txEmoji, { backgroundColor: sheet.goal.color + '20' }]}>
                    <Text style={{ fontSize: 24 }}>{sheet.goal.emoji}</Text>
                  </View>
                  <View>
                    <Text style={[styles.txGoalName, { color: colors.foreground }]}>{sheet.goal.name}</Text>
                    <Text style={[styles.txGoalSub, { color: colors.mutedForeground }]}>
                      {sheet.kind === 'fund'
                        ? `Wallet balance: ₦${fmt(balance)}`
                        : `Available to withdraw: ₦${fmt(sheet.goal.savedAmount)}`}
                    </Text>
                  </View>
                </View>

                {/* Amount input */}
                <View>
                  <Text style={[styles.formLabel, { color: colors.mutedForeground, marginBottom: 8 }]}>Amount (₦)</Text>
                  <TextInput
                    style={[styles.amountInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: sheet.goal.color }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    value={txAmount}
                    onChangeText={setTxAmount}
                    autoFocus
                  />
                </View>

                {/* Quick amounts */}
                <View style={styles.quickAmounts}>
                  {[5000, 10000, 20000, 50000].map(a => (
                    <TouchableOpacity
                      key={a}
                      style={[styles.quickChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => setTxAmount(String(a))}
                    >
                      <Text style={[styles.quickChipText, { color: colors.foreground }]}>₦{(a / 1000).toFixed(0)}k</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Confirm button */}
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: sheet.goal.color, opacity: txLoading ? 0.7 : 1 }]}
                  onPress={sheet.kind === 'fund' ? handleFund : handleWithdraw}
                  disabled={txLoading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmBtnText}>
                    {txLoading ? 'Processing…' : sheet.kind === 'fund' ? 'Add to Goal' : 'Withdraw to Wallet'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  headerGrad: { paddingHorizontal: 16, paddingBottom: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#fff' },

  summaryBlock: { alignItems: 'center', gap: 4 },
  summaryLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  summaryAmount: { fontFamily: 'Inter_700Bold', fontSize: 32, color: '#fff', letterSpacing: -1 },
  summaryCount: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  emptyCard: { borderRadius: 20, padding: 40, alignItems: 'center', gap: 12, marginTop: 20 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  fab: { position: 'absolute', right: 20, shadowColor: '#00A859', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 8 },
  fabGrad: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },

  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalCancel: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  modalTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  modalSave: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },

  formSection: { gap: 4 },
  formLabel: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontFamily: 'Inter_400Regular', fontSize: 16, marginTop: 6 },

  emojiRow: { flexDirection: 'row', gap: 8 },
  emojiPick: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorSwatchSelected: { borderWidth: 3, borderColor: 'rgba(0,0,0,0.2)' },

  detailActions: { flexDirection: 'row', gap: 12 },
  detailBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14 },
  detailBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
  detailBtnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1.5 },
  detailBtnOutlineText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },

  infoCard: { borderRadius: 16, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  infoLabel: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  infoValue: { fontFamily: 'Inter_500Medium', fontSize: 14 },

  txGoalRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  txEmoji: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txGoalName: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  txGoalSub: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 2 },

  amountInput: { borderWidth: 2, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, fontFamily: 'Inter_600SemiBold', fontSize: 28 },
  quickAmounts: { flexDirection: 'row', gap: 10 },
  quickChip: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1 },
  quickChipText: { fontFamily: 'Inter_500Medium', fontSize: 13 },

  confirmBtn: { borderRadius: 14, padding: 18, alignItems: 'center' },
  confirmBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
});
