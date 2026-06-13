import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { Transaction, useWallet } from '@/context/WalletContext';
import { useColors } from '@/hooks/useColors';

// Lazy-import ViewShot only on native to avoid web crash
let captureRef: ((ref: React.RefObject<View | null>, opts?: object) => Promise<string>) | null = null;
if (Platform.OS !== 'web') {
  // Dynamic require — safe because this module is only evaluated on native
  try {
    captureRef = require('react-native-view-shot').captureRef;
  } catch {}
}

function fmt(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function categoryLabel(cat: Transaction['category']) {
  switch (cat) {
    case 'transfer': return 'Bank Transfer';
    case 'airtime': return 'Airtime Top-Up';
    case 'data': return 'Data Purchase';
    case 'bill': return 'Bill Payment';
    case 'deposit': return 'Credit / Deposit';
    default: return 'Transaction';
  }
}

function categoryIcon(cat: Transaction['category']): { name: string; bg: string; color: string } {
  switch (cat) {
    case 'transfer': return { name: 'arrow-right', bg: '#EEF2FF', color: '#4F46E5' };
    case 'airtime': return { name: 'phone', bg: '#FFF7ED', color: '#EA580C' };
    case 'data': return { name: 'wifi', bg: '#F0F9FF', color: '#0284C7' };
    case 'bill': return { name: 'zap', bg: '#FFFBEB', color: '#D97706' };
    case 'deposit': return { name: 'arrow-down-circle', bg: '#F0FDF4', color: '#16A34A' };
    default: return { name: 'circle', bg: '#F3F4F6', color: '#6B7280' };
  }
}

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions } = useWallet();
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const receiptRef = useRef<View>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const tx = transactions.find(t => t.id === id);

  if (!tx) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Receipt</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Transaction not found</Text>
        </View>
      </View>
    );
  }

  const isCredit = tx.type === 'credit';
  const statusOk = tx.status === 'success';
  const icon = categoryIcon(tx.category);

  const handleShare = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Share', `Transaction: ${tx.description}\nAmount: ₦${fmt(tx.amount)}\nRef: ${tx.reference}`);
      return;
    }
    if (!captureRef || !receiptRef.current) {
      Alert.alert('Error', 'Could not capture receipt. Please try again.');
      return;
    }

    setSharing(true);
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const uri = await captureRef(receiptRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        snapshotContentContainer: false,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Payment Receipt',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not supported on this device.');
      }
    } catch (err: any) {
      Alert.alert('Share Failed', err?.message ?? 'Could not share receipt. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Receipt</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleShare}
          activeOpacity={0.7}
          disabled={sharing}
        >
          {sharing
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Feather name="share-2" size={20} color={colors.primary} />
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: botPad + 32, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Receipt Card (captured as image on share) ── */}
        <View ref={receiptRef} collapsable={false}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>

            {/* Top gradient band */}
            <LinearGradient
              colors={['#0A1E4D', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardBrand}
            >
              <View style={styles.brandRow}>
                <View style={styles.brandLogo}>
                  <Text style={styles.brandLogoText}>G</Text>
                </View>
                <View>
                  <Text style={styles.brandName}>Guudees</Text>
                  <Text style={styles.brandSub}>Good Money. Good Life.</Text>
                </View>
              </View>
              <Text style={styles.brandReceipt}>Payment Receipt</Text>
            </LinearGradient>

            {/* Status badge */}
            <View style={styles.statusRow}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: statusOk ? '#F0FDF4' : tx.status === 'pending' ? '#FFFBEB' : '#FEF2F2' }
              ]}>
                <Feather
                  name={statusOk ? 'check-circle' : tx.status === 'pending' ? 'clock' : 'x-circle'}
                  size={16}
                  color={statusOk ? '#16A34A' : tx.status === 'pending' ? '#D97706' : '#DC2626'}
                />
                <Text style={[
                  styles.statusText,
                  { color: statusOk ? '#16A34A' : tx.status === 'pending' ? '#D97706' : '#DC2626' }
                ]}>
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </Text>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.amountSection}>
              <View style={[styles.catIconLarge, { backgroundColor: icon.bg }]}>
                <Feather name={icon.name as any} size={28} color={icon.color} />
              </View>
              <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>
                {categoryLabel(tx.category)}
              </Text>
              <Text style={[styles.amount, { color: isCredit ? '#16A34A' : colors.foreground }]}>
                {isCredit ? '+' : '-'}₦{fmt(tx.amount)}
              </Text>
            </View>

            {/* Divider with jagged edge */}
            <View style={styles.tearRow}>
              <View style={[styles.halfCircle, styles.halfCircleLeft, { backgroundColor: colors.background }]} />
              <View style={[styles.tearLine, { borderColor: colors.border }]} />
              <View style={[styles.halfCircle, styles.halfCircleRight, { backgroundColor: colors.background }]} />
            </View>

            {/* Details rows */}
            <View style={styles.detailsBlock}>
              {[
                { label: 'Description', value: tx.description },
                { label: isCredit ? 'From' : 'To', value: tx.party },
                { label: 'Date', value: fmtDate(tx.date) },
                { label: 'Time', value: fmtTime(tx.date) },
                { label: 'Reference', value: tx.reference, mono: true },
                { label: 'Account', value: user?.accountNumber ?? '—' },
                { label: 'Bank', value: user?.bankName ?? 'Guudees MFB' },
              ].map((row, i) => (
                <View key={i} style={[styles.detailRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: colors.foreground },
                    row.mono && styles.detailValueMono,
                  ]} numberOfLines={2}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                Issued by Guudees MFB • CBN Licensed
              </Text>
              <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                Generated {fmtDate(new Date().toISOString())} at {fmtTime(new Date().toISOString())}
              </Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary }]}
            onPress={handleShare}
            disabled={sharing}
            activeOpacity={0.85}
          >
            {sharing
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Feather name="share-2" size={18} color="#fff" />
                  <Text style={styles.shareBtnText}>Share Receipt</Text>
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.doneBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={[styles.doneBtnText, { color: colors.foreground }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontFamily: 'Inter_400Regular', fontSize: 15 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },

  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 6,
  },

  cardBrand: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, gap: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandLogo: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  brandLogoText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 18 },
  brandName: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
  brandSub: { color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter_400Regular', fontSize: 11 },
  brandReceipt: { color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter_500Medium', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 },

  statusRow: { alignItems: 'center', paddingTop: 20, paddingBottom: 4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  amountSection: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24, gap: 8 },
  catIconLarge: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  categoryLabel: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  amount: { fontFamily: 'Inter_700Bold', fontSize: 38, letterSpacing: -1 },

  tearRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  halfCircle: { width: 18, height: 18, borderRadius: 9 },
  halfCircleLeft: { marginLeft: -9 },
  halfCircleRight: { marginRight: -9 },
  tearLine: { flex: 1, borderTopWidth: 1.5, borderStyle: 'dashed' },

  detailsBlock: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 12, gap: 16 },
  detailLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1 },
  detailValue: { fontFamily: 'Inter_500Medium', fontSize: 13, flex: 2, textAlign: 'right' },
  detailValueMono: { fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 0.5 },

  cardFooter: { borderTopWidth: 1, paddingHorizontal: 24, paddingVertical: 16, gap: 4 },
  footerText: { fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center' },

  actions: { marginTop: 20, gap: 12 },
  shareBtn: {
    borderRadius: 14, padding: 17, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  shareBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
  doneBtn: { borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1 },
  doneBtnText: { fontFamily: 'Inter_500Medium', fontSize: 15 },
});
