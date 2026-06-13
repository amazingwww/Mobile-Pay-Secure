import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
import { useCards, type CardData } from '@/context/CardContext';
import { useColors } from '@/hooks/useColors';

function fmt(n: number) {
  return '₦' + n.toLocaleString('en-NG');
}

// ─── Animated credit card ────────────────────────────────────────────────────
function CardVisual({ card, flipped }: { card: CardData; flipped: boolean }) {
  const { user } = useAuth();
  const name = user?.accountName ?? user?.name ?? 'GUUDEES USER';
  const isVirtual = card.kind === 'virtual';
  const isBlocked = card.status === 'blocked';
  const isFrozen = card.status === 'frozen';

  const gradients: [string, string, ...string[]] = isVirtual
    ? ['#0A1E4D', '#1A3A8F', '#2563EB']
    : ['#0A1E4D', '#7B6012', '#F2B705'];

  return (
    <LinearGradient
      colors={isBlocked ? ['#374151', '#6B7280', '#9CA3AF'] : (isFrozen ? ['#1E3A5F', '#2D5282', '#4299E1'] : gradients)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      {/* Frosted circles for depth */}
      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      {/* Top row: Guudees wordmark + badge */}
      <View style={styles.cardTopRow}>
        <Text style={styles.cardBrand}>Guudees</Text>
        <View style={[styles.cardBadge, { backgroundColor: isVirtual ? 'rgba(255,255,255,0.15)' : 'rgba(242,183,5,0.3)' }]}>
          <Text style={styles.cardBadgeText}>{isVirtual ? 'VIRTUAL' : 'PHYSICAL'}</Text>
        </View>
      </View>

      {/* Status overlay */}
      {(isFrozen || isBlocked) && (
        <View style={styles.statusOverlay}>
          <Feather name={isBlocked ? 'slash' : 'pause-circle'} size={24} color="rgba(255,255,255,0.7)" />
          <Text style={styles.statusText}>{isBlocked ? 'BLOCKED' : 'FROZEN'}</Text>
        </View>
      )}

      {/* Chip */}
      <View style={styles.chip}>
        <View style={styles.chipLine} />
        <View style={styles.chipLine} />
        <View style={styles.chipLine} />
      </View>

      {/* Card number / CVV */}
      {!flipped ? (
        <Text style={styles.cardNumber}>{card.maskedPan}</Text>
      ) : (
        <View style={styles.cvvRow}>
          <Text style={styles.cvvLabel}>CVV</Text>
          <Text style={styles.cvvValue}>{card.cvv}</Text>
        </View>
      )}

      {/* Bottom row */}
      <View style={styles.cardBottomRow}>
        <View>
          <Text style={styles.cardLabel}>CARD HOLDER</Text>
          <Text style={styles.cardHolder} numberOfLines={1}>{name.toUpperCase()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.cardLabel}>EXPIRES</Text>
          <Text style={styles.cardExpiry}>{card.expiry}</Text>
        </View>
        <Text style={styles.cardNetwork}>{isVirtual ? 'VISA' : 'MASTERCARD'}</Text>
      </View>
    </LinearGradient>
  );
}

// ─── Control button ───────────────────────────────────────────────────────────
function ControlBtn({ icon, label, onPress, active, danger }: {
  icon: any; label: string; onPress: () => void; active?: boolean; danger?: boolean;
}) {
  const colors = useColors();
  const bg = danger ? '#FEE2E2' : active ? colors.primary + '18' : colors.card;
  const fg = danger ? '#DC2626' : active ? colors.primary : colors.foreground;
  return (
    <TouchableOpacity style={[styles.ctrlBtn, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.75}>
      <Feather name={icon} size={20} color={fg} />
      <Text style={[styles.ctrlLabel, { color: fg }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Limit row ────────────────────────────────────────────────────────────────
function LimitRow({ label, value, onEdit }: { label: string; value: number; onEdit: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.limitRow, { borderBottomColor: colors.border }]}>
      <View>
        <Text style={[styles.limitLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.limitValue, { color: colors.foreground }]}>{fmt(value)}</Text>
      </View>
      <TouchableOpacity onPress={onEdit} style={[styles.editBtn, { backgroundColor: colors.secondary }]}>
        <Feather name="edit-2" size={14} color={colors.primary} />
        <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function CardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { virtual, physical, toggleFreeze, blockCard, requestPhysical, updateLimit } = useCards();

  const [activeTab, setActiveTab] = useState<'virtual' | 'physical'>('virtual');
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  // Request physical card modal
  const [showRequest, setShowRequest] = useState(false);
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');

  // Limit edit modal
  const [limitModal, setLimitModal] = useState<{ kind: 'virtual' | 'physical'; field: 'dailyLimit' | 'monthlyLimit'; label: string } | null>(null);
  const [limitInput, setLimitInput] = useState('');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const card = activeTab === 'virtual' ? virtual : physical;

  function handleFlip() {
    if (card.status === 'blocked') return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = flipped ? 0 : 1;
    Animated.spring(flipAnim, { toValue, useNativeDriver: true, friction: 8, tension: 40 }).start();
    setFlipped(!flipped);
  }

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  function handleFreeze() {
    if (card.status === 'blocked') return Alert.alert('Card Blocked', 'This card has been permanently blocked.');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFreeze(activeTab);
  }

  function handleBlock() {
    if (card.status === 'blocked') return;
    Alert.alert(
      'Block Card',
      'This action is permanent and cannot be undone. The card will be permanently disabled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block Card',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            blockCard(activeTab);
          },
        },
      ],
    );
  }

  function handleRequestPhysical() {
    if (!address.trim()) return Alert.alert('Address Required', 'Please enter a delivery address.');
    requestPhysical(`${address.trim()}${landmark.trim() ? ', ' + landmark.trim() : ''}`);
    setShowRequest(false);
    setAddress('');
    setLandmark('');
    Alert.alert('Request Submitted ✓', 'Your physical card is being processed. Estimated delivery: 5–7 business days.');
  }

  function openLimitEdit(kind: 'virtual' | 'physical', field: 'dailyLimit' | 'monthlyLimit', label: string) {
    setLimitInput('');
    setLimitModal({ kind, field, label });
  }

  function saveLimitEdit() {
    if (!limitModal) return;
    const val = parseFloat(limitInput.replace(/,/g, ''));
    if (!val || val <= 0) return Alert.alert('Invalid Amount', 'Please enter a valid limit.');
    if (val > 50_000_000) return Alert.alert('Limit Too High', 'Maximum allowed limit is ₦50,000,000.');
    updateLimit(limitModal.kind, limitModal.field, val);
    setLimitModal(null);
  }

  const physStatus = physical.physicalStatus ?? 'not_requested';
  const statusLabels: Record<string, string> = {
    not_requested: 'Not Requested',
    processing: 'Processing',
    in_transit: 'In Transit',
    delivered: 'Delivered',
  };
  const statusColors: Record<string, string> = {
    not_requested: colors.mutedForeground,
    processing: '#D97706',
    in_transit: '#2563EB',
    delivered: '#10B981',
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>My Cards</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Tab switcher */}
      <View style={[styles.tabRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(['virtual', 'physical'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && { backgroundColor: colors.primary }]}
            onPress={() => { setActiveTab(t); setFlipped(false); flipAnim.setValue(0); }}
            activeOpacity={0.8}
          >
            <Feather
              name={t === 'virtual' ? 'smartphone' : 'credit-card'}
              size={14}
              color={activeTab === t ? '#fff' : colors.mutedForeground}
            />
            <Text style={[styles.tabText, { color: activeTab === t ? '#fff' : colors.mutedForeground }]}>
              {t === 'virtual' ? 'Virtual Card' : 'Physical Card'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 100, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Card visual with flip */}
        <View style={styles.cardContainer}>
          <TouchableOpacity onPress={handleFlip} activeOpacity={0.95}>
            {/* Front */}
            <Animated.View style={[styles.cardFace, { transform: [{ rotateY: frontRotate }], backfaceVisibility: 'hidden' }]}>
              <CardVisual card={card} flipped={false} />
            </Animated.View>
            {/* Back */}
            <Animated.View style={[styles.cardFace, styles.cardBack, { transform: [{ rotateY: backRotate }], backfaceVisibility: 'hidden' }]}>
              <CardVisual card={card} flipped={true} />
            </Animated.View>
          </TouchableOpacity>
          <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>
            {card.status === 'active' ? '✦ Tap card to reveal CVV' : ''}
          </Text>
        </View>

        {/* Quick controls */}
        <View style={[styles.ctrlRow, { backgroundColor: colors.card }]}>
          <ControlBtn
            icon={card.status === 'frozen' ? 'play-circle' : 'pause-circle'}
            label={card.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
            active={card.status === 'frozen'}
            onPress={handleFreeze}
          />
          <ControlBtn
            icon="copy"
            label="Copy No."
            onPress={() => Alert.alert('Copied', `Card ending in ${card.last4} copied.`)}
          />
          <ControlBtn
            icon="bar-chart-2"
            label="Limits"
            onPress={() => {}}
          />
          <ControlBtn
            icon="slash"
            label="Block"
            danger
            onPress={handleBlock}
          />
        </View>

        {/* Card details */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Card Details</Text>
          <DetailRow label="Card Type" value={activeTab === 'virtual' ? 'Visa Virtual Debit' : 'Mastercard Debit'} colors={colors} />
          <DetailRow label="Card Number" value={`•••• •••• •••• ${card.last4}`} colors={colors} />
          <DetailRow label="Expiry Date" value={card.expiry} colors={colors} />
          <DetailRow
            label="Status"
            value={card.status.charAt(0).toUpperCase() + card.status.slice(1)}
            valueColor={card.status === 'active' ? '#10B981' : card.status === 'frozen' ? '#F2B705' : '#DC2626'}
            colors={colors}
          />
          {activeTab === 'virtual' && (
            <DetailRow label="Usage" value="Online purchases & payments" colors={colors} />
          )}
          {activeTab === 'physical' && physStatus !== 'not_requested' && (
            <DetailRow
              label="Delivery Status"
              value={statusLabels[physStatus]}
              valueColor={statusColors[physStatus]}
              colors={colors}
            />
          )}
          {activeTab === 'physical' && physical.deliveryAddress && (
            <DetailRow label="Delivery Address" value={physical.deliveryAddress} colors={colors} />
          )}
          {activeTab === 'physical' && physical.estimatedDelivery && physStatus !== 'delivered' && (
            <DetailRow label="Est. Delivery" value={physical.estimatedDelivery} colors={colors} />
          )}
        </View>

        {/* Spending Limits */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Spending Limits</Text>
          <LimitRow
            label="Daily Limit"
            value={card.dailyLimit}
            onEdit={() => openLimitEdit(activeTab, 'dailyLimit', 'Daily Limit')}
          />
          <LimitRow
            label="Monthly Limit"
            value={card.monthlyLimit}
            onEdit={() => openLimitEdit(activeTab, 'monthlyLimit', 'Monthly Limit')}
          />
        </View>

        {/* Physical card CTA */}
        {activeTab === 'physical' && physStatus === 'not_requested' && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.physicalCta}>
              <LinearGradient colors={['#0A1E4D', '#F2B705']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.physCtaAccent} />
              <View style={styles.physCtaContent}>
                <Text style={[styles.physCtaTitle, { color: colors.foreground }]}>Get Your Physical Card</Text>
                <Text style={[styles.physCtaSub, { color: colors.mutedForeground }]}>
                  A Mastercard Debit card delivered to your door in 5–7 business days. Works at any ATM or POS in Nigeria.
                </Text>
                <TouchableOpacity
                  style={[styles.requestBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setShowRequest(true)}
                  activeOpacity={0.8}
                >
                  <Feather name="credit-card" size={16} color="#fff" />
                  <Text style={styles.requestBtnText}>Request Physical Card</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Physical card tracking */}
        {activeTab === 'physical' && physStatus !== 'not_requested' && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Delivery Tracking</Text>
            {(['processing', 'in_transit', 'delivered'] as const).map((step, i) => {
              const stepOrder = { processing: 0, in_transit: 1, delivered: 2 };
              const currentOrder = stepOrder[physStatus as 'processing' | 'in_transit' | 'delivered'] ?? -1;
              const done = i <= currentOrder;
              const active = i === currentOrder;
              return (
                <View key={step} style={styles.trackStep}>
                  <View style={[styles.trackDot, {
                    backgroundColor: done ? colors.primary : colors.border,
                    borderColor: active ? colors.primary : colors.border,
                  }]}>
                    {done && <Feather name="check" size={10} color="#fff" />}
                  </View>
                  {i < 2 && <View style={[styles.trackLine, { backgroundColor: i < currentOrder ? colors.primary : colors.border }]} />}
                  <Text style={[styles.trackLabel, { color: done ? colors.foreground : colors.mutedForeground, fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
                    {statusLabels[step]}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Security tips */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Card Security</Text>
          {[
            { icon: 'lock', tip: 'Never share your CVV or card number with anyone' },
            { icon: 'shield', tip: 'Guudees will never ask for your PIN via call or SMS' },
            { icon: 'eye-off', tip: 'Freeze your card immediately if you suspect fraud' },
          ].map(({ icon, tip }) => (
            <View key={tip} style={styles.tipRow}>
              <View style={[styles.tipIcon, { backgroundColor: colors.primary + '15' }]}>
                <Feather name={icon as any} size={14} color={colors.primary} />
              </View>
              <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Request Physical Card Modal */}
      <Modal visible={showRequest} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Request Physical Card</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              We'll deliver your Mastercard Debit card to the address below. A fee of ₦1,000 applies.
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Delivery Address</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Street address, city, state"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={2}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 16 }]}>Nearest Landmark (optional)</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input }]}
              value={landmark}
              onChangeText={setLandmark}
              placeholder="E.g. beside Unity Bank"
              placeholderTextColor={colors.mutedForeground}
            />

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleRequestPhysical}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>Confirm Request — ₦1,000</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowRequest(false)} style={styles.cancelLink}>
              <Text style={[styles.cancelLinkText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Limit edit modal */}
      <Modal visible={!!limitModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Edit {limitModal?.label}</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Current: {limitModal ? fmt(limitModal.kind === 'virtual' ? (limitModal.field === 'dailyLimit' ? virtual.dailyLimit : virtual.monthlyLimit) : (limitModal.field === 'dailyLimit' ? physical.dailyLimit : physical.monthlyLimit)) : ''}
            </Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.input, fontSize: 22, fontFamily: 'Inter_600SemiBold' }]}
              value={limitInput}
              onChangeText={t => setLimitInput(t.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="New limit (₦)"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
            />
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={saveLimitEdit} activeOpacity={0.85}>
              <Text style={styles.confirmBtnText}>Save Limit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLimitModal(null)} style={styles.cancelLink}>
              <Text style={[styles.cancelLinkText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value, valueColor, colors }: { label: string; value: string; valueColor?: string; colors: any }) {
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: valueColor ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20 },

  tabRow: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 16, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10 },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  cardContainer: { marginHorizontal: 16, marginBottom: 16, alignItems: 'center' },
  cardFace: { width: '100%' },
  cardBack: { position: 'absolute', top: 0, left: 0, right: 0 },
  cardGradient: { borderRadius: 20, padding: 24, height: 200, overflow: 'hidden', position: 'relative' },

  circleTop: { position: 'absolute', top: -60, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
  circleBottom: { position: 'absolute', bottom: -80, left: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.05)' },

  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardBrand: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#fff', letterSpacing: -0.3 },
  cardBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  cardBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#fff', letterSpacing: 1 },

  statusOverlay: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 },
  statusText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: 'rgba(255,255,255,0.9)', letterSpacing: 3 },

  chip: { width: 40, height: 30, borderRadius: 6, backgroundColor: 'rgba(255,223,120,0.9)', marginBottom: 16, justifyContent: 'space-around', paddingHorizontal: 4, paddingVertical: 5 },
  chipLine: { height: 2, backgroundColor: 'rgba(180,140,0,0.6)', borderRadius: 1 },

  cardNumber: { fontFamily: 'Inter_500Medium', fontSize: 18, color: '#fff', letterSpacing: 2, marginBottom: 16 },
  cvvRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  cvvLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  cvvValue: { fontFamily: 'Inter_700Bold', fontSize: 24, color: '#fff', letterSpacing: 4 },

  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardLabel: { fontFamily: 'Inter_400Regular', fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 2 },
  cardHolder: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#fff', maxWidth: 140 },
  cardExpiry: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
  cardNetwork: { fontFamily: 'Inter_700Bold', fontSize: 16, color: 'rgba(255,255,255,0.8)', letterSpacing: 1, alignSelf: 'flex-end' },

  tapHint: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 10, opacity: 0.6 },

  ctrlRow: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 16, padding: 16, gap: 8, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  ctrlBtn: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  ctrlLabel: { fontFamily: 'Inter_500Medium', fontSize: 11 },

  section: { marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginBottom: 16 },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  detailLabel: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  detailValue: { fontFamily: 'Inter_500Medium', fontSize: 13, maxWidth: '55%', textAlign: 'right' },

  limitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  limitLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, marginBottom: 3 },
  limitValue: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { fontFamily: 'Inter_500Medium', fontSize: 12 },

  physicalCta: { overflow: 'hidden', borderRadius: 12, backgroundColor: 'transparent' },
  physCtaAccent: { height: 4, borderRadius: 2, marginBottom: 16 },
  physCtaContent: { gap: 8 },
  physCtaTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  physCtaSub: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  requestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  requestBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },

  trackStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 0 },
  trackDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  trackLine: { position: 'absolute', left: 10, top: 22, width: 2, height: 28, borderRadius: 1 },
  trackLabel: { fontSize: 14, paddingBottom: 28 },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  tipIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tipText: { fontFamily: 'Inter_400Regular', fontSize: 13, flex: 1, lineHeight: 19 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, marginBottom: 6 },
  modalSub: { fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 20, lineHeight: 20 },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontFamily: 'Inter_400Regular', fontSize: 15, marginBottom: 4 },
  confirmBtn: { borderRadius: 14, padding: 17, alignItems: 'center', marginTop: 20 },
  confirmBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
  cancelLink: { alignItems: 'center', marginTop: 14 },
  cancelLinkText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
});
