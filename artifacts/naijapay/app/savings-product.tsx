import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { useColors } from '@/hooks/useColors';

// ─── Product definitions ───────────────────────────────────────────────────

type Feature = {
  icon: string;
  title: string;
  desc: string;
  highlight?: string;
};

type TemplateGoal = {
  emoji: string;
  name: string;
  joined: string;
  hot?: boolean;
};

type ProductDef = {
  emoji: string;
  name: string;
  tagline: string;
  rate: string;
  rateNote?: string;
  gradients: [string, string, ...string[]];
  features: Feature[];
  templates?: TemplateGoal[];
  offerLabel?: string;
  offerRate?: string;
  offerDuration?: string;
  ctaLabel: string;
};

const PRODUCTS: Record<string, ProductDef> = {
  autosave: {
    emoji: '🔄',
    name: 'AutoSave',
    tagline: 'Save automatically, grow every day.',
    rate: '12% p.a.',
    gradients: ['#1D4ED8', '#2563EB', '#3B82F6'],
    features: [
      { icon: 'trending-up', title: 'Interest Yield', desc: 'Earn 12% per annum on every naira saved — credited daily.' },
      { icon: 'clock', title: 'AutoSave Schedule', desc: 'Set a daily, weekly or monthly auto-debit. We handle the rest.' },
      { icon: 'plus-circle', title: 'Flexible Top-up', desc: 'Top up anytime — manual or automatic, no minimum amount.' },
      { icon: 'download', title: 'Instant Withdrawal', desc: 'Withdraw to your Guudees wallet instantly, any time you need.' },
    ],
    ctaLabel: 'Activate AutoSave',
  },
  targets: {
    emoji: '🎯',
    name: 'Savings Targets',
    tagline: 'Save with discipline towards a specific goal.',
    rate: '10% p.a.',
    gradients: ['#5B21B6', '#6D28D9', '#7C3AED'],
    templates: [
      { emoji: '☀️', name: 'Summer Vacation', joined: '40,782 have joined', hot: true },
      { emoji: '🏠', name: 'House Rent', joined: '444,649 have joined' },
      { emoji: '💰', name: 'Millionaire Saving', joined: '283,435 have joined' },
      { emoji: '📱', name: 'New Device', joined: '98,210 have joined' },
      { emoji: '🎓', name: 'School Fees', joined: '175,003 have joined' },
    ],
    features: [
      { icon: 'trending-up', title: 'Interest Yield', desc: 'Interest rate is 10% p.a. — credited to your target daily.' },
      { icon: 'clock', title: 'Savings Duration', desc: 'One to twelve months. You choose the deadline that works for you.' },
      { icon: 'plus-circle', title: 'Savings Top-up', desc: 'Anytime (manual or automatic top-up options available).' },
    ],
    ctaLabel: 'Create Target',
  },
  safebox: {
    emoji: '🔒',
    name: 'SafeBox',
    tagline: 'Build a disciplined saving habit.',
    rate: '13% p.a.',
    gradients: ['#065F46', '#047857', '#059669'],
    features: [
      { icon: 'trending-up', title: 'Interest Yield', desc: 'Earn 13% per annum — higher than a regular savings account.' },
      { icon: 'archive', title: 'Build a Saving Habit', desc: 'Deposit anytime, or set up AutoSave for daily/weekly/monthly transfers.' },
      { icon: 'calendar', title: 'Disciplined Withdrawal', desc: 'Set a schedule to enjoy free withdrawals on designated dates.' },
      { icon: 'check-circle', title: 'Halal Option', desc: 'Opt out of interest to keep your savings Halal-compliant.' },
    ],
    ctaLabel: 'Start Saving',
  },
  fixed: {
    emoji: '📈',
    name: 'Fixed Deposit',
    tagline: 'Deposit & earn maximum returns.',
    rate: '15–18% p.a.',
    rateNote: 'New User Exclusive: up to 22% p.a.',
    gradients: ['#78350F', '#92400E', '#D97706'],
    offerLabel: 'New User Exclusive Offer',
    offerRate: '22%',
    offerDuration: '7 days',
    features: [
      { icon: 'trending-up', title: 'Interest Yield', desc: 'Interest rates are 15%–18% p.a., depending on duration.', highlight: '15–18%' },
      { icon: 'clock', title: 'Savings Duration', desc: '7 to 1,000 days — pick the lock-in that suits your plan.' },
      { icon: 'plus-circle', title: 'Savings Top-up', desc: 'One-time initial deposit. Earn from day one.' },
      { icon: 'alert-circle', title: 'Early Withdrawal', desc: 'You can withdraw anytime, but doing so before maturity forfeits accrued interest.' },
    ],
    ctaLabel: 'Create Fixed Deposit',
  },
  spend_save: {
    emoji: '🛍️',
    name: 'Spend & Save',
    tagline: 'Save a percentage or fixed amount every time you spend or transfer.',
    rate: '10–15% p.a.',
    gradients: ['#881337', '#9F1239', '#E11D48'],
    features: [
      { icon: 'shopping-bag', title: 'Spend & Save', desc: 'Automatically save a fixed amount or percentage with every payment you make.' },
      { icon: 'trending-up', title: 'Interest Yield', desc: '₦50,000 and below: 15% p.a. Over ₦50,000: the first ₦50k at 15%, the remaining at 5% p.a.', highlight: '15% / 5%' },
      { icon: 'download', title: 'Free & Instant Withdrawal', desc: 'Withdraw your funds anytime for free — no lock-in, no penalty.' },
    ],
    ctaLabel: 'Activate Spend & Save',
  },
};

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const id = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  return `${d}d ${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}

export default function SavingsProductScreen() {
  const { product } = useLocalSearchParams<{ product: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const countdown = useCountdown(151 * 86400 + 3 * 3600 + 22 * 60);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const def = PRODUCTS[product ?? 'autosave'] ?? PRODUCTS.autosave;

  function handleCta() {
    if (product === 'targets') {
      router.push('/savings');
    } else {
      Alert.alert(
        def.ctaLabel,
        `${def.name} will be fully activated once you connect your Safe Haven credentials. Your savings will start earning ${def.rate} immediately.`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Go to Savings', onPress: () => router.push('/savings') },
        ]
      );
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{def.name}</Text>
        <TouchableOpacity>
          <Text style={[styles.moreLink, { color: colors.primary }]}>More</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 100 }}
      >
        {/* ── Hero banner ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <LinearGradient
            colors={def.gradients}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <View style={styles.heroCircle1} />
            <View style={styles.heroCircle2} />

            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{def.name}</Text>
              {def.rateNote && (
                <View style={styles.rateChipHero}>
                  <Text style={styles.rateChipText}>{def.rate}</Text>
                </View>
              )}
              <Text style={styles.heroTagline}>{def.tagline}</Text>
              <View style={styles.poweredRow}>
                <Feather name="shield" size={11} color="rgba(255,255,255,0.7)" />
                <Text style={styles.poweredText}>Powered by Guudees Digital Services</Text>
              </View>
            </View>
            <Text style={styles.heroEmoji}>{def.emoji}</Text>
          </LinearGradient>
        </View>

        {/* ── Fixed Deposit: New User Offer ── */}
        {def.offerLabel && (
          <View style={[styles.offerCard, { backgroundColor: colors.card }]}>
            <View style={styles.offerTop}>
              <View>
                <Text style={[styles.offerLabel, { color: colors.foreground }]}>{def.offerLabel}</Text>
                <Text style={[styles.offerCountdown, { color: '#DC2626' }]}>{countdown} left</Text>
              </View>
              <View>
                <Text style={[styles.offerQuota, { color: colors.mutedForeground }]}>Quota: ₦5B</Text>
                <View style={[styles.offerBar, { backgroundColor: colors.border }]}>
                  <View style={[styles.offerFill, { backgroundColor: colors.primary }]} />
                </View>
                <Text style={[styles.offerSuff, { color: '#10B981' }]}>Sufficient</Text>
              </View>
            </View>
            <View style={styles.offerRateRow}>
              <View>
                <Text style={[styles.offerBigRate, { color: colors.primary }]}>{def.offerRate}%</Text>
                <Text style={[styles.offerBaseRate, { color: colors.mutedForeground }]}>{def.rate}</Text>
                <Text style={[styles.offerRateLabel, { color: colors.mutedForeground }]}>Interest p.a.</Text>
              </View>
              <View style={[styles.offerDivider, { backgroundColor: colors.border }]} />
              <View>
                <Text style={[styles.offerBigRate, { color: colors.foreground }]}>{def.offerDuration}</Text>
                <Text style={[styles.offerRateLabel, { color: colors.mutedForeground }]}>Duration</Text>
              </View>
              <TouchableOpacity
                style={[styles.saveNowBtn, { backgroundColor: colors.primary }]}
                onPress={handleCta}
                activeOpacity={0.85}
              >
                <Text style={styles.saveNowText}>Save Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Targets: Find Targets templates ── */}
        {def.templates && (
          <View style={{ marginBottom: 24 }}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Find Targets</Text>
              <TouchableOpacity>
                <Text style={[styles.moreLink, { color: colors.primary }]}>More ›</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {def.templates.map(t => (
                <TouchableOpacity
                  key={t.name}
                  style={[styles.templateCard, { backgroundColor: colors.card }]}
                  onPress={() => router.push('/savings')}
                  activeOpacity={0.85}
                >
                  {t.hot && (
                    <View style={[styles.hotBadge, { backgroundColor: '#DC2626' }]}>
                      <Text style={styles.hotText}>Hot</Text>
                    </View>
                  )}
                  <View style={[styles.templateIconBox, { backgroundColor: colors.background }]}>
                    <Text style={{ fontSize: 30 }}>{t.emoji}</Text>
                  </View>
                  <Text style={[styles.templateName, { color: colors.foreground }]}>{t.name}</Text>
                  <Text style={[styles.templateJoined, { color: colors.mutedForeground }]}>{t.joined}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── About section ── */}
        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 14 }]}>
            About {def.name}
          </Text>
          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            {def.features.map((f, i) => (
              <View key={f.title}>
                <View style={styles.featureRow}>
                  <LinearGradient
                    colors={def.gradients}
                    style={styles.featureIconBox}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Feather name={f.icon as any} size={18} color="#fff" />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
                    <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>
                      {f.desc}
                      {!!f.highlight && (
                        <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>{' '}{f.highlight}</Text>
                      )}
                    </Text>
                  </View>
                </View>
                {i < def.features.length - 1 && (
                  <View style={[styles.featureDivider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── Spacer for sticky button ── */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── Sticky CTA ── */}
      <View
        style={[
          styles.ctaContainer,
          {
            backgroundColor: colors.background,
            paddingBottom: Platform.OS === 'web' ? 24 : insets.bottom + 16,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={handleCta}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={def.gradients}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtnGradient}
          >
            <Text style={styles.ctaBtnText}>{def.ctaLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
          Licensed by CBN  •  Insured by NDIC  •  Powered by Guudees Digital Services
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    flex: 1,
    textAlign: 'center',
  },
  moreLink: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },

  heroBanner: {
    borderRadius: 20,
    padding: 24,
    minHeight: 150,
    flexDirection: 'row',
    alignItems: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
  },
  heroCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroCircle2: {
    position: 'absolute',
    bottom: -60,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  rateChipHero: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  rateChipText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#F2B705',
  },
  heroTagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 19,
    marginBottom: 14,
    maxWidth: 220,
  },
  poweredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  poweredText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  heroEmoji: {
    fontSize: 56,
    marginLeft: 12,
    marginTop: -4,
  },

  offerCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  offerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  offerLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginBottom: 4,
  },
  offerCountdown: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  offerQuota: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginBottom: 4,
    textAlign: 'right',
  },
  offerBar: {
    width: 100,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 2,
  },
  offerFill: {
    width: '85%',
    height: '100%',
    borderRadius: 3,
  },
  offerSuff: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    textAlign: 'right',
  },
  offerRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  offerBigRate: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    letterSpacing: -0.5,
  },
  offerBaseRate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginTop: -2,
  },
  offerRateLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  offerDivider: {
    width: 1,
    height: 48,
  },
  saveNowBtn: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginLeft: 'auto',
  },
  saveNowText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
  },
  templateCard: {
    width: 130,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  hotBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  hotText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: '#fff',
  },
  templateIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  templateJoined: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 14,
  },

  featureCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 18,
  },
  featureIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginBottom: 4,
  },
  featureDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  featureDivider: {
    height: 1,
    marginLeft: 74,
  },

  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  ctaBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  ctaBtnGradient: {
    paddingVertical: 17,
    alignItems: 'center',
  },
  ctaBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 0.2,
  },
  footerNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    textAlign: 'center',
    paddingBottom: 4,
  },
});
