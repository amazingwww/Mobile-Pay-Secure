import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const ACTIONS = [
  { icon: 'gift', label: 'Daily Bonus', color: '#F2B705', bg: '#FFFBEB', reward: '₦50' },
  { icon: 'users', label: 'Refer Friends', color: '#2563EB', bg: '#EFF6FF', reward: '₦1,000' },
  { icon: 'award', label: 'Spin & Win', color: '#7C3AED', bg: '#F5F3FF', reward: '₦500' },
  { icon: 'tag', label: 'Vouchers', color: '#059669', bg: '#ECFDF5', reward: 'Free' },
];

const VOUCHERS = [
  { id: 'v1', amount: '₦500', title: 'Transfer Cashback', desc: '₦10,000 min transfer', expires: '5 days left', color: '#2563EB' },
  { id: 'v2', amount: '₦200', title: 'Airtime Bonus', desc: '₦2,000 min recharge', expires: '12 days left', color: '#059669' },
  { id: 'v3', amount: '₦1,000', title: 'Bills Discount', desc: 'On electricity payment', expires: '3 days left', color: '#D97706' },
];

const DEALS = [
  { id: 'd1', label: '₦30', title: '1GB / 1 Day — 50% off', network: 'MTN', originalPrice: '₦400', salePrice: '₦200', slots: 112, discount: '50% OFF', sold: false },
  { id: 'd2', label: '₦50', title: '750MB / 7 Days — 40% off', network: 'Airtel', originalPrice: '₦600', salePrice: '₦360', slots: 73, discount: '40% OFF', sold: false },
  { id: 'd3', label: '₦100', title: '2GB / 30 Days — SOLD OUT', network: 'Glo', originalPrice: '₦1,000', salePrice: '₦600', slots: 0, discount: '40% OFF', sold: true },
];

function useCountdown(endHour: number) {
  const calcTime = () => {
    const now = new Date();
    const end = new Date();
    end.setHours(endHour, 0, 0, 0);
    if (end <= now) end.setDate(end.getDate() + 1);
    const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
    return { h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 };
  };
  const [time, setTime] = useState(calcTime);
  useEffect(() => {
    const id = setInterval(() => setTime(calcTime()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export default function RewardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const countdown = useCountdown(20); // deals end at 20:00
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const spinAnim = useRef(new Animated.Value(0)).current;

  function handleSpin() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(spinAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(spinAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start(() => Alert.alert('Spin & Win 🎉', 'You won ₦50 cashback! Credited to your wallet.'));
  }

  const spinRotate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 14 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Rewards</Text>
        <TouchableOpacity style={[styles.headerMoreBtn, { backgroundColor: colors.card }]}>
          <Feather name="more-horizontal" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 100 }}>
        {/* Cashback + G-Points hero */}
        <LinearGradient
          colors={['#0A1E4D', '#1A3A8F', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />

          <View style={styles.heroRow}>
            {/* Cashback */}
            <TouchableOpacity style={styles.heroItem} activeOpacity={0.8}>
              <View style={styles.heroLabelRow}>
                <Text style={styles.heroLabel}>Cashback</Text>
                <Feather name="help-circle" size={12} color="rgba(255,255,255,0.5)" />
              </View>
              <View style={styles.heroValueRow}>
                <View style={styles.coinDot}>
                  <Text style={{ fontSize: 14 }}>🪙</Text>
                </View>
                <Text style={styles.heroCurrency}>₦</Text>
                <Text style={styles.heroValue}>6.00</Text>
                <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.6)" />
              </View>
            </TouchableOpacity>

            <View style={styles.heroDivider} />

            {/* G-Points */}
            <TouchableOpacity style={styles.heroItem} activeOpacity={0.8}>
              <View style={styles.heroLabelRow}>
                <Text style={styles.heroLabel}>G-Points</Text>
                <View style={styles.gPointsBadge}>
                  <Text style={styles.gPointsBadgeText}>130</Text>
                </View>
              </View>
              <View style={styles.heroValueRow}>
                <Text style={styles.heroValueAlt}>⭐ </Text>
                <Text style={styles.heroValue}>2</Text>
                <Text style={styles.heroValueUnit}> vouchers</Text>
                <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.6)" />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Action tiles */}
        <View style={[styles.actionsGrid, { backgroundColor: colors.card }]}>
          {ACTIONS.map(a => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionTile}
              activeOpacity={0.75}
              onPress={a.label === 'Spin & Win' ? handleSpin : () => Alert.alert(a.label, `Earn up to ${a.reward} with this action.`)}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                {a.label === 'Spin & Win' ? (
                  <Animated.View style={{ transform: [{ rotate: spinRotate }] }}>
                    <Feather name={a.icon as any} size={26} color={a.color} />
                  </Animated.View>
                ) : (
                  <Feather name={a.icon as any} size={26} color={a.color} />
                )}
              </View>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>{a.label}</Text>
              <Text style={[styles.actionReward, { color: a.color }]}>+{a.reward}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hot Vouchers */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hot Vouchers</Text>
            <View style={[styles.voucherBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.voucherBadgeText}>G-POINTS</Text>
            </View>
          </View>

          <View style={[styles.voucherList, { backgroundColor: colors.card }]}>
            {VOUCHERS.map((v, i) => (
              <View key={v.id}>
                <View style={styles.voucherRow}>
                  <LinearGradient
                    colors={[v.color, v.color + 'CC']}
                    style={styles.voucherAmtBox}
                  >
                    <Text style={styles.voucherAmt}>{v.amount}</Text>
                  </LinearGradient>
                  <View style={[styles.voucherDividerLine, { backgroundColor: colors.border }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.voucherTitle, { color: colors.foreground }]}>{v.title}</Text>
                    <Text style={[styles.voucherDesc, { color: colors.mutedForeground }]}>{v.desc}</Text>
                    <Text style={[styles.voucherExpiry, { color: colors.mutedForeground }]}>{v.expires}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.useBtn, { backgroundColor: colors.primary }]}
                    onPress={() => Alert.alert('Voucher Applied ✓', `${v.title} has been applied.`)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.useBtnText}>Use</Text>
                  </TouchableOpacity>
                </View>
                {i < VOUCHERS.length - 1 && <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />}
              </View>
            ))}
          </View>
        </View>

        {/* Hot Deals */}
        <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hot Deals</Text>
              <Text style={{ fontSize: 16 }}>⚡</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Rules', 'Hot Deals are flash sales available for a limited time.')}>
              <Text style={[styles.rulesLink, { color: colors.mutedForeground }]}>Rules ›</Text>
            </TouchableOpacity>
          </View>

          {/* Data category + countdown */}
          <View style={[styles.dealHeader, { backgroundColor: colors.card }]}>
            <View style={styles.dealCategoryRow}>
              <Text style={[styles.dealCategory, { color: colors.foreground, borderBottomColor: colors.primary }]}>Data</Text>
            </View>
            <View style={styles.countdownRow}>
              <Text style={[styles.countdownLabel, { color: colors.mutedForeground }]}>End after</Text>
              {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((seg, i) => (
                <React.Fragment key={i}>
                  <View style={[styles.countdownSeg, { backgroundColor: colors.primary }]}>
                    <Text style={styles.countdownDigit}>{seg}</Text>
                  </View>
                  {i < 2 && <Text style={[styles.countdownColon, { color: colors.foreground }]}>:</Text>}
                </React.Fragment>
              ))}
            </View>
          </View>

          <View style={[styles.dealList, { backgroundColor: colors.card }]}>
            {DEALS.map((d, i) => (
              <View key={d.id}>
                <View style={styles.dealRow}>
                  <View style={[styles.discountBadge, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.discountText, { color: colors.primary }]}>{d.discount}</Text>
                  </View>
                  <View style={[styles.networkBall, { backgroundColor: d.network === 'MTN' ? '#FCD34D' : d.network === 'Airtel' ? '#DC2626' : '#059669' }]}>
                    <Text style={styles.networkText}>{d.network[0]}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.dealTitle, { color: colors.foreground }]}>{d.title}</Text>
                    <View style={[styles.dealBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.dealFill, { width: `${Math.min(100, d.slots)}%`, backgroundColor: colors.primary }]} />
                    </View>
                    <View style={styles.dealPriceRow}>
                      <Text style={[styles.dealSalePrice, { color: colors.primary }]}>{d.salePrice}</Text>
                      <Text style={[styles.dealOrigPrice, { color: colors.mutedForeground }]}>{d.originalPrice}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.dealBtn, { backgroundColor: d.sold ? colors.border : colors.card, borderColor: d.sold ? colors.border : colors.primary }]}
                    onPress={() => d.sold ? null : Alert.alert('Deal Claimed!', `${d.title} has been added to your cart.`)}
                    disabled={d.sold}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dealBtnText, { color: d.sold ? colors.mutedForeground : colors.primary }]}>
                      {d.sold ? 'Sold out' : 'Get it'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {i < DEALS.length - 1 && <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />}
              </View>
            ))}
          </View>
        </View>

        {/* Refer banner */}
        <LinearGradient
          colors={['#F2B705', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.referBanner}
        >
          <View>
            <Text style={styles.referTitle}>Invite Friends, Earn More!</Text>
            <Text style={styles.referSub}>Get ₦1,000 for every friend who joins Guudees</Text>
          </View>
          <TouchableOpacity style={styles.referBtn} onPress={() => Alert.alert('Referral', 'Your referral code: GUUD-ADO123\n\nShare with friends and earn ₦1,000 for each successful signup!')}>
            <Text style={styles.referBtnText}>Invite</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.3 },
  headerMoreBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },

  heroCard: { marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 16, overflow: 'hidden', position: 'relative' },
  heroCircle1: { position: 'absolute', top: -50, right: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroCircle2: { position: 'absolute', bottom: -60, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroItem: { flex: 1, gap: 8 },
  heroDivider: { width: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 16 },
  heroLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  heroValueRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  coinDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  heroCurrency: { fontFamily: 'Inter_400Regular', fontSize: 16, color: '#fff' },
  heroValue: { fontFamily: 'Inter_700Bold', fontSize: 24, color: '#fff' },
  heroValueAlt: { fontFamily: 'Inter_400Regular', fontSize: 18, color: '#F2B705' },
  heroValueUnit: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.65)', marginLeft: 1 },
  gPointsBadge: { backgroundColor: '#F2B705', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  gPointsBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#0A1E4D' },

  actionsGrid: { marginHorizontal: 16, borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  actionTile: { alignItems: 'center', flex: 1, gap: 8 },
  actionIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, textAlign: 'center' },
  actionReward: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  voucherBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  voucherBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#fff', letterSpacing: 0.5 },

  voucherList: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  voucherRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  voucherAmtBox: { width: 54, height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  voucherAmt: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' },
  voucherDividerLine: { width: 1, height: 40 },
  voucherTitle: { fontFamily: 'Inter_500Medium', fontSize: 14, marginBottom: 2 },
  voucherDesc: { fontFamily: 'Inter_400Regular', fontSize: 11, marginBottom: 2 },
  voucherExpiry: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  useBtn: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  useBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#fff' },
  rowDivider: { height: 1, marginLeft: 16 },

  dealHeader: { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dealCategoryRow: { flexDirection: 'row' },
  dealCategory: { fontFamily: 'Inter_600SemiBold', fontSize: 14, borderBottomWidth: 2, paddingBottom: 4 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countdownLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, marginRight: 4 },
  countdownSeg: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, minWidth: 26, alignItems: 'center' },
  countdownDigit: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' },
  countdownColon: { fontFamily: 'Inter_700Bold', fontSize: 13 },

  dealList: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  dealRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  discountBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, alignSelf: 'flex-start' },
  discountText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  networkBall: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  networkText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' },
  dealTitle: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  dealBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  dealFill: { height: '100%', borderRadius: 2 },
  dealPriceRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dealSalePrice: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  dealOrigPrice: { fontFamily: 'Inter_400Regular', fontSize: 12, textDecorationLine: 'line-through' },
  dealBtn: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  dealBtnText: { fontFamily: 'Inter_500Medium', fontSize: 12 },

  rulesLink: { fontFamily: 'Inter_400Regular', fontSize: 13 },

  referBanner: { marginHorizontal: 16, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  referTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#0A1E4D', marginBottom: 4 },
  referSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#0A1E4D', opacity: 0.75 },
  referBtn: { backgroundColor: '#0A1E4D', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 },
  referBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#F2B705' },
});
