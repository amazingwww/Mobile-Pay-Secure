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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScheduleFrequency, ScheduledPayment, useScheduled } from '@/context/ScheduledContext';
import { useColors } from '@/hooks/useColors';

const BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'GTBank', code: '058' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'UBA', code: '033' },
  { name: 'First Bank', code: '011' },
  { name: 'Stanbic IBTC', code: '039' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Guudees Digital Services', code: '090xxx' },
];

function fmt(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days}d`;
}

function parseAmount(s: string) {
  return parseFloat(s.replace(/,/g, '')) || 0;
}

type Sheet = { kind: 'create' } | { kind: 'detail'; payment: ScheduledPayment } | null;

export default function ScheduledScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { payments, createPayment, deletePayment, pausePayment, resumePayment, runNow } = useScheduled();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [sheet, setSheet] = useState<Sheet>(null);
  const [running, setRunning] = useState<string | null>(null);

  // Create form
  const [form, setForm] = useState({
    name: '',
    recipientName: '',
    accountNumber: '',
    bankCode: '044',
    bankName: 'Access Bank',
    amount: '',
    narration: '',
    frequency: 'monthly' as ScheduleFrequency,
    startDate: '',
  });

  const resetForm = () => setForm({ name: '', recipientName: '', accountNumber: '', bankCode: '044', bankName: 'Access Bank', amount: '', narration: '', frequency: 'monthly', startDate: '' });

  const handleCreate = () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Enter a name for this payment.'); return; }
    if (!form.recipientName.trim()) { Alert.alert('Error', 'Enter recipient name.'); return; }
    if (form.accountNumber.length < 10) { Alert.alert('Error', 'Enter a valid 10-digit account number.'); return; }
    const amt = parseAmount(form.amount);
    if (amt <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }

    let startDate = new Date();
    if (form.startDate) {
      const parsed = new Date(form.startDate);
      if (!isNaN(parsed.getTime())) startDate = parsed;
    }
    if (form.frequency === 'weekly') startDate.setDate(startDate.getDate() + 7);
    else startDate.setMonth(startDate.getMonth() + 1);

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createPayment({
      name: form.name.trim(),
      recipientName: form.recipientName.trim(),
      accountNumber: form.accountNumber,
      bankCode: form.bankCode,
      bankName: form.bankName,
      amount: amt,
      narration: form.narration.trim() || form.name.trim(),
      frequency: form.frequency,
      nextRunDate: startDate.toISOString(),
    });
    resetForm();
    setSheet(null);
  };

  const handleRunNow = async (p: ScheduledPayment) => {
    Alert.alert(
      'Run Now',
      `Send ₦${fmt(p.amount)} to ${p.recipientName} now?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send', onPress: async () => {
            setRunning(p.id);
            const result = await runNow(p.id);
            setRunning(null);
            if (result.ok) {
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Sent! ✅', `₦${fmt(p.amount)} sent to ${p.recipientName}.`);
              setSheet(null);
            } else {
              Alert.alert('Failed', result.error ?? 'Could not send. Try again.');
            }
          }
        },
      ]
    );
  };

  const handleDelete = (p: ScheduledPayment) => {
    Alert.alert('Delete Payment', `Delete "${p.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deletePayment(p.id); setSheet(null); } },
    ]);
  };

  const active = payments.filter(p => p.status === 'active');
  const paused = payments.filter(p => p.status === 'paused');

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#0A1E4D', '#1E3A8A', '#2563EB']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.headerGrad, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scheduled Payments</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{active.length}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{paused.length}</Text>
            <Text style={styles.summaryLabel}>Paused</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>
              ₦{(active.reduce((s, p) => s + p.amount, 0) / 1000).toFixed(0)}k
            </Text>
            <Text style={styles.summaryLabel}>Monthly</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: botPad + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {payments.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Text style={styles.emptyEmoji}>🔄</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No scheduled payments</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Set up recurring transfers and Guudees will send them automatically.
            </Text>
          </View>
        )}

        {payments.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => setSheet({ kind: 'detail', payment: p })}
            activeOpacity={0.78}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.freqBadge, { backgroundColor: p.frequency === 'monthly' ? '#EEF4FF' : '#FFF8E1' }]}>
                <Feather
                  name={p.frequency === 'monthly' ? 'calendar' : 'refresh-cw'}
                  size={14}
                  color={p.frequency === 'monthly' ? '#2563EB' : '#F2B705'}
                />
                <Text style={[styles.freqText, { color: p.frequency === 'monthly' ? '#2563EB' : '#D97706' }]}>
                  {p.frequency === 'monthly' ? 'Monthly' : 'Weekly'}
                </Text>
              </View>
              <Text style={[styles.cardName, { color: colors.foreground }]}>{p.name}</Text>
              <Text style={[styles.cardRecipient, { color: colors.mutedForeground }]} numberOfLines={1}>
                {p.recipientName} • {p.bankName}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardAmt, { color: colors.foreground }]}>₦{fmt(p.amount)}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: p.status === 'active' ? '#F0FDF4' : '#F3F4F6' }
              ]}>
                <View style={[styles.statusDot, { backgroundColor: p.status === 'active' ? '#16A34A' : '#9CA3AF' }]} />
                <Text style={[styles.statusText, { color: p.status === 'active' ? '#16A34A' : '#6B7280' }]}>
                  {p.status === 'active' ? daysUntil(p.nextRunDate) : 'Paused'}
                </Text>
              </View>
              <Text style={[styles.cardRuns, { color: colors.mutedForeground }]}>{p.runCount} runs</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: botPad + 20 }]}
        onPress={() => { resetForm(); setSheet({ kind: 'create' }); }}
        activeOpacity={0.85}
      >
        <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.fabGrad}>
          <Feather name="plus" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Create modal ── */}
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
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Schedule</Text>
              <TouchableOpacity onPress={handleCreate}>
                <Text style={[styles.modalSave, { color: colors.primary }]}>Create</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} showsVerticalScrollIndicator={false}>
              {[
                { label: 'Schedule Name', placeholder: 'e.g. Monthly Rent', key: 'name' },
                { label: 'Recipient Name', placeholder: 'Full name', key: 'recipientName' },
                { label: 'Account Number', placeholder: '10-digit number', key: 'accountNumber', numeric: true },
                { label: 'Amount (₦)', placeholder: '0.00', key: 'amount', numeric: true },
                { label: 'Narration / Note', placeholder: 'Optional description', key: 'narration' },
              ].map(field => (
                <View key={field.key}>
                  <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType={field.numeric ? 'numeric' : 'default'}
                    value={(form as any)[field.key]}
                    onChangeText={v => setForm(f => ({ ...f, [field.key]: v }))}
                  />
                </View>
              ))}

              {/* Bank picker */}
              <View>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Provider</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  <View style={styles.bankRow}>
                    {BANKS.map(b => (
                      <TouchableOpacity
                        key={b.code}
                        style={[
                          styles.bankChip,
                          { backgroundColor: form.bankCode === b.code ? colors.primary : colors.card, borderColor: form.bankCode === b.code ? colors.primary : colors.border }
                        ]}
                        onPress={() => setForm(f => ({ ...f, bankCode: b.code, bankName: b.name }))}
                      >
                        <Text style={[styles.bankChipText, { color: form.bankCode === b.code ? '#fff' : colors.foreground }]}>
                          {b.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Frequency */}
              <View>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Frequency</Text>
                <View style={styles.freqRow}>
                  {(['weekly', 'monthly'] as ScheduleFrequency[]).map(f => (
                    <TouchableOpacity
                      key={f}
                      style={[
                        styles.freqOption,
                        { backgroundColor: form.frequency === f ? colors.primary : colors.card, borderColor: form.frequency === f ? colors.primary : colors.border }
                      ]}
                      onPress={() => setForm(prev => ({ ...prev, frequency: f }))}
                    >
                      <Feather
                        name={f === 'monthly' ? 'calendar' : 'refresh-cw'}
                        size={16}
                        color={form.frequency === f ? '#fff' : colors.mutedForeground}
                      />
                      <Text style={[styles.freqOptionText, { color: form.frequency === f ? '#fff' : colors.foreground }]}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Start date */}
              <View>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>First Run Date (YYYY-MM-DD, optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                  placeholder={`e.g. ${new Date().toISOString().slice(0, 10)}`}
                  placeholderTextColor={colors.mutedForeground}
                  value={form.startDate}
                  onChangeText={v => setForm(f => ({ ...f, startDate: v }))}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Detail modal ── */}
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
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>{sheet.payment.name}</Text>
              <TouchableOpacity onPress={() => handleDelete(sheet.payment)}>
                <Feather name="trash-2" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
              {/* Amount hero */}
              <View style={[styles.amtHero, { backgroundColor: colors.primary + '12' }]}>
                <Text style={[styles.amtHeroLabel, { color: colors.mutedForeground }]}>Transfer Amount</Text>
                <Text style={[styles.amtHeroVal, { color: colors.primary }]}>₦{fmt(sheet.payment.amount)}</Text>
                <View style={[styles.freqBadge, { backgroundColor: sheet.payment.frequency === 'monthly' ? '#EEF4FF' : '#FFF8E1', alignSelf: 'center', marginTop: 8 }]}>
                  <Feather name={sheet.payment.frequency === 'monthly' ? 'calendar' : 'refresh-cw'} size={13} color={sheet.payment.frequency === 'monthly' ? '#2563EB' : '#D97706'} />
                  <Text style={[styles.freqText, { color: sheet.payment.frequency === 'monthly' ? '#2563EB' : '#D97706' }]}>
                    {sheet.payment.frequency === 'monthly' ? 'Every month' : 'Every week'}
                  </Text>
                </View>
              </View>

              {/* Details */}
              <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                {[
                  { label: 'Recipient', value: sheet.payment.recipientName },
                  { label: 'Bank', value: sheet.payment.bankName },
                  { label: 'Account', value: sheet.payment.accountNumber },
                  { label: 'Narration', value: sheet.payment.narration },
                  { label: 'Next Run', value: fmtDate(sheet.payment.nextRunDate) + ` (${daysUntil(sheet.payment.nextRunDate)})` },
                  { label: 'Last Run', value: sheet.payment.lastRunDate ? fmtDate(sheet.payment.lastRunDate) : '—' },
                  { label: 'Total Runs', value: String(sheet.payment.runCount) },
                  { label: 'Created', value: fmtDate(sheet.payment.createdAt) },
                ].map((row, i) => (
                  <View key={i} style={[styles.infoRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>{row.value}</Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleRunNow(sheet.payment)}
                  disabled={running === sheet.payment.id}
                  activeOpacity={0.85}
                >
                  <Feather name="send" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>{running === sheet.payment.id ? 'Sending…' : 'Run Now'}</Text>
                </TouchableOpacity>

                {sheet.payment.status === 'active' ? (
                  <TouchableOpacity
                    style={[styles.actionBtnOutline, { borderColor: colors.border, backgroundColor: colors.card }]}
                    onPress={() => { pausePayment(sheet.payment.id); setSheet(null); }}
                    activeOpacity={0.8}
                  >
                    <Feather name="pause-circle" size={16} color={colors.mutedForeground} />
                    <Text style={[styles.actionBtnOutlineText, { color: colors.foreground }]}>Pause</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtnOutline, { borderColor: colors.primary, backgroundColor: colors.secondary }]}
                    onPress={() => { resumePayment(sheet.payment.id); setSheet(null); }}
                    activeOpacity={0.8}
                  >
                    <Feather name="play-circle" size={16} color={colors.primary} />
                    <Text style={[styles.actionBtnOutlineText, { color: colors.primary }]}>Resume</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Pause/active toggle */}
              <View style={[styles.toggleRow, { backgroundColor: colors.card }]}>
                <View>
                  <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Auto-execute</Text>
                  <Text style={[styles.toggleSub, { color: colors.mutedForeground }]}>
                    Guudees sends this automatically when due
                  </Text>
                </View>
                <Switch
                  value={sheet.payment.status === 'active'}
                  onValueChange={on => {
                    if (on) resumePayment(sheet.payment.id);
                    else pausePayment(sheet.payment.id);
                    setSheet(null);
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerGrad: { paddingHorizontal: 16, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#fff' },
  summaryRow: { flexDirection: 'row', justifyContent: 'center', gap: 0 },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryNum: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#fff' },
  summaryLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },

  emptyCard: { borderRadius: 20, padding: 40, alignItems: 'center', gap: 12, marginTop: 16 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  card: {
    borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardLeft: { flex: 1, gap: 6 },
  cardRight: { alignItems: 'flex-end', gap: 6, marginLeft: 12 },
  freqBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  freqText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  cardName: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  cardRecipient: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  cardAmt: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  cardRuns: { fontFamily: 'Inter_400Regular', fontSize: 11 },

  fab: { position: 'absolute', right: 20, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 8 },
  fabGrad: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },

  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalCancel: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  modalTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  modalSave: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },

  formLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontFamily: 'Inter_400Regular', fontSize: 15 },

  bankRow: { flexDirection: 'row', gap: 8 },
  bankChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  bankChipText: { fontFamily: 'Inter_500Medium', fontSize: 12 },

  freqRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  freqOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1.5 },
  freqOptionText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  amtHero: { borderRadius: 16, padding: 24, alignItems: 'center', gap: 4 },
  amtHeroLabel: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  amtHeroVal: { fontFamily: 'Inter_700Bold', fontSize: 36, letterSpacing: -1 },

  infoCard: { borderRadius: 16, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13 },
  infoLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1 },
  infoValue: { fontFamily: 'Inter_500Medium', fontSize: 13, flex: 2, textAlign: 'right' },

  detailActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14 },
  actionBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
  actionBtnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1.5 },
  actionBtnOutlineText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: 16 },
  toggleLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginBottom: 2 },
  toggleSub: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
