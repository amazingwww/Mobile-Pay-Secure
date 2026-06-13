import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSavings } from '@/context/SavingsContext';
import { useColors } from '@/hooks/useColors';

type Product = {
  emoji: string;
  name: string;
  tagline: string;
  rate: string;
  desc: string;
  badge: string | null;
  gradients: [string, string, ...string[]];
};

const PRODUCTS: Product[] = [
  {
    emoji: '🔄',
    name: 'AutoSave',
    tagline: 'Save automatically',
    rate: '12% p.a.',
    desc: 'Set a daily, weekly or monthly auto-debit and watch your money grow effortlessly.',
    badge: null,
    gradients: ['#1D4ED8', '#3B82F6'],
  },
  {
    emoji: '🎯',
    name: 'Savings Targets',
    tagline: 'Goal-based saving',
    rate: '10% p.a.',
    desc: 'Create a goal — school fees, vacation, gadget — and track your progress every day.',
    badge: null,
    gradients: ['#6D28D9', '#8B5CF6'],
  },
  {
    emoji: '🔒',
    name: 'SafeBox',
    tagline: 'Lock & earn more',
    rate: '13% p.a.',
    desc: 'Lock funds for a fixed period and earn higher interest. Break only when you need to.',
    badge: null,
    gradients: ['#065F46', '#059669'],
  },
  {
    emoji: '📈',
    name: 'Fixed Deposit',
    tagline: 'Maximum returns',
    rate: '15% p.a.',
    desc: 'Park your funds for 30–360 days at our highest interest rate. Ideal for lump sums.',
    badge: 'New',
    gradients: ['#92400E', '#D97706'],
  },
  {
    emoji: '🛍️',
    name: 'Spend & Save',
    tagline: 'Save as you spend',
    rate: '10% p.a.',
    desc: 'Every time you spend, a percentage goes straight into your savings. Painless saving.',
    badge: null,
    gradients: ['#9F1239', '#E11D48'],
  },
];

function fmt(n: number, short = false) {
  if (short && n >= 1000) return `₦${(n / 1000).toFixed(1)}k`;
  return '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ProductCard({ p, colors }: { p: Product; colors: any }) {
  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push('/savings')}
      activeOpacity={0.88}
    >
      <LinearGradient
        colors={p.gradients}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.productCardGradient}
      >
        {/* Decorative circles */}
        <View style={styles.pcCircle1} />
        <View style={styles.pcCircle2} />

        {/* Badge */}
        {p.badge && (
          <View style={styles.pcBadge}>
            <Text style={styles.pcBadgeText}>{p.badge}</Text>
          </View>
        )}

        {/* Emoji */}
        <Text style={styles.pcEmoji}>{p.emoji}</Text>

        {/* Name + tagline */}
        <Text style={styles.pcName}>{p.name}</Text>
        <Text style={styles.pcTagline}>{p.tagline}</Text>

        {/* Rate chip */}
        <View style={styles.pcRateChip}>
          <Feather name="trending-up" size={11} color="#F2B705" />
          <Text style={styles.pcRate}>{p.rate}</Text>
        </View>

        {/* Description */}
        <Text style={styles.pcDesc} numberOfLines={3}>{p.desc}</Text>

        {/* CTA */}
        <View style={styles.pcCta}>
          <Text style={styles.pcCtaText}>Open →</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function FinanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, totalSaved } = useSavings();
  const [tab, setTab] = useState<'savings' | 'loan'>('savings');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const interestToday = (totalSaved * 0.15) / 365;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 14 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Finance</Text>
        <TouchableOpacity style={[styles.headerIcon, { backgroundColor: colors.card }]}>
          <Feather name="settings" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 100 }}
      >
        {/* ── Savings / Loan tabs ── */}
        <View style={[styles.tabStrip, { borderBottomColor: colors.border }]}>
          {(['savings', 'loan'] as const).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => {
                if (t === 'loan') {
                  Alert.alert('Coming Soon', 'Guudees Loans will be available soon. Stay tuned!');
                  return;
                }
                setTab(t);
              }}
              style={[
                styles.tabItem,
                tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: tab === t ? colors.primary : colors.mutedForeground,
                    fontFamily: tab === t ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  },
                ]}
              >
                {t === 'savings' ? 'Savings' : 'Loan'}
              </Text>
              {t === 'loan' && (
                <View style={styles.hotBadge}>
                  <Text style={styles.hotText}>Hot</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Balance hero card ── */}
        <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 20 }}>
          <LinearGradient
            colors={['#0A1E4D', '#1A3A8F', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceCircleL} />
            <View style={styles.balanceCircleR} />

            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                  <Text style={styles.balanceCurrency}>₦</Text>
                  <Text style={styles.balanceAmount}>
                    {Math.floor(totalSaved).toLocaleString('en-NG')}
                  </Text>
                  <Text style={styles.balanceDecimal}>
                    .{String(Math.round((totalSaved % 1) * 100)).padStart(2, '0')}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.interestLabel}>Interest Today</Text>
                <Text style={styles.interestAmt}>+{fmt(interestToday)}</Text>
                <Feather name="chevron-right" size={14} color="rgba(242,183,5,0.8)" style={{ marginTop: 2 }} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewBreakdown}
              onPress={() => router.push('/savings')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewBreakdownText}>View Assets Breakdown</Text>
              <Feather name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* ── Savings Product Cards (horizontal scroll) ── */}
        <View style={{ marginBottom: 20 }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Savings Products</Text>
            <TouchableOpacity onPress={() => router.push('/savings')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all ›</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {PRODUCTS.map(p => (
              <ProductCard key={p.name} p={p} colors={colors} />
            ))}
          </ScrollView>
        </View>

        {/* ── Exclusive Rewards banner ── */}
        <TouchableOpacity
          style={[styles.rewardsBanner, { backgroundColor: colors.card }]}
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert('Exclusive Rewards', 'Complete savings tasks to earn cashback and bonus interest.')
          }
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <Text style={[styles.rewardsBannerTitle, { color: colors.foreground }]}>Your Exclusive Rewards!</Text>
              <Text style={[styles.seeAll, { color: colors.primary }]}>View All ›</Text>
            </View>
            <Text style={[styles.rewardsBannerDesc, { color: colors.mutedForeground }]}>
              Complete tasks and earn cash rewards.
            </Text>
            <View style={[styles.rewardsTask, { backgroundColor: colors.background }]}>
              <Text style={[styles.rewardsTaskText, { color: colors.foreground }]}>
                Save ₦10,000 to AutoSave
              </Text>
              <View style={[styles.signupBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.signupBtnText}>Start Now</Text>
              </View>
            </View>
            <View style={[styles.rewardChip, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.rewardChipText, { color: '#92400E' }]}>🎁 Reward: ₦500</Text>
            </View>
          </View>
          <LinearGradient
            colors={['#F2B705', '#D97706']}
            style={styles.rewardsBannerAccent}
          >
            <Feather name="gift" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Saving Challenge banner ── */}
        <LinearGradient
          colors={['#0A1E4D', '#1A3A8F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.challengeBanner}
        >
          <Text style={{ fontSize: 40 }}>🪙</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.challengeTitle}>Saving Challenge 2026</Text>
            <Text style={styles.challengeSub}>Start small daily, finish big in 2026</Text>
            <TouchableOpacity
              style={styles.challengeBtn}
              onPress={() => router.push('/savings')}
              activeOpacity={0.85}
            >
              <Text style={styles.challengeBtnText}>START SAVING NOW</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── Goals summary ── */}
        {goals.length > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                My Goals ({goals.length})
              </Text>
              <TouchableOpacity onPress={() => router.push('/savings')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all ›</Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              {goals.slice(0, 3).map(g => {
                const pct = Math.min(1, g.savedAmount / g.targetAmount);
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.goalRow, { backgroundColor: colors.card }]}
                    onPress={() => router.push('/savings')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.goalEmoji, { backgroundColor: g.color + '20' }]}>
                      <Text style={{ fontSize: 22 }}>{g.emoji}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 5 }}>
                      <View style={styles.goalNameRow}>
                        <Text style={[styles.goalName, { color: colors.foreground }]}>{g.name}</Text>
                        <Text style={[styles.goalPct, { color: g.color }]}>{Math.round(pct * 100)}%</Text>
                      </View>
                      <View style={[styles.goalBar, { backgroundColor: colors.border }]}>
                        <View style={[styles.goalFill, { width: `${pct * 100}%` as any, backgroundColor: g.color }]} />
                      </View>
                      <Text style={[styles.goalAmts, { color: colors.mutedForeground }]}>
                        {fmt(g.savedAmount, true)} of {fmt(g.targetAmount, true)}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {goals.length === 0 && (
          <TouchableOpacity
            style={[styles.emptyGoals, { backgroundColor: colors.card }]}
            onPress={() => router.push('/savings')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 40 }}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No savings goals yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Create your first goal and start building wealth
            </Text>
            <View style={[styles.createGoalBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.createGoalText}>Create a Goal</Text>
            </View>
          </TouchableOpacity>
        )}

        <Text style={[styles.cbnNote, { color: colors.mutedForeground }]}>
          Licensed by CBN  •  Insured by NDIC  •  Powered by Guudees Digital Services
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.3 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  tabStrip: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1 },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    marginRight: 28,
  },
  tabLabel: { fontSize: 15 },
  hotBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hotText: { fontFamily: 'Inter_600SemiBold', fontSize: 9, color: '#fff' },

  balanceCard: {
    borderRadius: 20,
    padding: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  balanceCircleL: {
    position: 'absolute',
    top: -50,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  balanceCircleR: {
    position: 'absolute',
    bottom: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  balanceLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 6,
  },
  balanceCurrency: {
    fontFamily: 'Inter_400Regular',
    fontSize: 22,
    color: '#fff',
    paddingBottom: 4,
  },
  balanceAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 38,
    color: '#fff',
    letterSpacing: -1,
  },
  balanceDecimal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 22,
    color: 'rgba(255,255,255,0.7)',
    paddingBottom: 4,
  },
  interestLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 4,
  },
  interestAmt: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#F2B705' },
  viewBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  viewBreakdownText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  seeAll: { fontFamily: 'Inter_500Medium', fontSize: 13 },

  /* Product card */
  productCard: {
    width: 170,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  productCardGradient: {
    padding: 18,
    minHeight: 210,
    overflow: 'hidden',
    position: 'relative',
  },
  pcCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pcCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pcBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  pcBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#fff' },
  pcEmoji: { fontSize: 34, marginBottom: 10 },
  pcName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#fff',
    marginBottom: 2,
  },
  pcTagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 10,
  },
  pcRateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  pcRate: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#F2B705',
  },
  pcDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 16,
    marginBottom: 14,
    flex: 1,
  },
  pcCta: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  pcCtaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#fff',
  },

  rewardsBanner: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardsBannerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  rewardsBannerDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginBottom: 10,
  },
  rewardsTask: {
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  rewardsTaskText: { fontFamily: 'Inter_400Regular', fontSize: 12, flex: 1 },
  signupBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  signupBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#fff' },
  rewardChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  rewardChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  rewardsBannerAccent: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  challengeBanner: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  challengeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#F2B705',
    marginBottom: 4,
  },
  challengeSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  challengeBtn: {
    backgroundColor: '#F2B705',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  challengeBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#0A1E4D',
    letterSpacing: 0.5,
  },

  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  goalEmoji: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalNameRow: { flexDirection: 'row', justifyContent: 'space-between' },
  goalName: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  goalPct: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  goalBar: { height: 5, borderRadius: 3, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 3 },
  goalAmts: { fontFamily: 'Inter_400Regular', fontSize: 11 },

  emptyGoals: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  createGoalBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 4,
  },
  createGoalText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },

  cbnNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
});
