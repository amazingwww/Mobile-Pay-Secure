import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BalanceCard } from '@/components/BalanceCard';
import { QuickAction } from '@/components/QuickAction';
import { SavingsGoalCard } from '@/components/SavingsGoalCard';
import { TransactionItem } from '@/components/TransactionItem';
import { useAuth } from '@/context/AuthContext';
import { useSavings } from '@/context/SavingsContext';
import { useWallet } from '@/context/WalletContext';
import { useColors } from '@/hooks/useColors';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { balance, transactions } = useWallet();
  const { goals, totalSaved } = useSavings();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const firstName = user?.name?.split(' ')[0] ?? '';
  const recent = transactions.slice(0, 5);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{firstName}</Text>
        </View>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: colors.card }]}
          activeOpacity={0.7}
        >
          <Feather name="bell" size={20} color={colors.foreground} />
          <View style={[styles.notifDot, { backgroundColor: colors.accent }]} />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.cardWrap}>
        <BalanceCard
          balance={balance}
          accountNumber={user?.accountNumber ?? ''}
          accountName={user?.accountName ?? ''}
          bankName={user?.bankName ?? ''}
        />
      </View>

      {/* Quick Actions */}
      <View style={[styles.section, styles.actionsSection, { backgroundColor: colors.card }]}>
        <QuickAction
          icon="send"
          label="Send"
          onPress={() => router.push('/(tabs)/send')}
          color="#4F46E5"
          bg="#EEF2FF"
        />
        <QuickAction
          icon="download"
          label="Receive"
          onPress={() => router.push('/receive')}
          color="#059669"
          bg="#D1FAE5"
        />
        <QuickAction
          icon="phone"
          label="Airtime"
          onPress={() => router.push('/airtime')}
          color="#EA580C"
          bg="#FFF7ED"
        />
        <QuickAction
          icon="wifi"
          label="Data"
          onPress={() => router.push('/data')}
          color="#0284C7"
          bg="#F0F9FF"
        />
        <QuickAction
          icon="zap"
          label="Bills"
          onPress={() => router.push('/(tabs)/pay')}
          color="#D97706"
          bg="#FFFBEB"
        />
        <QuickAction
          icon="credit-card"
          label="Cards"
          onPress={() => router.push('/cards')}
          color="#7C3AED"
          bg="#F5F3FF"
        />
      </View>

      {/* Promo Banner */}
      <View style={[styles.promo, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.promoTitle}>Refer a Friend</Text>
          <Text style={styles.promoSub}>Earn ₦1,000 for every referral</Text>
        </View>
        <Feather name="gift" size={32} color="rgba(255,255,255,0.4)" />
      </View>

      {/* Savings Goals */}
      {goals.length > 0 && (
        <View style={styles.savingsSection}>
          <View style={styles.txHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Savings Goals</Text>
              <Text style={[styles.savingsSub, { color: colors.mutedForeground }]}>
                ₦{totalSaved.toLocaleString('en-NG', { minimumFractionDigits: 2 })} saved total
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/savings')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {goals.slice(0, 5).map(goal => (
              <SavingsGoalCard
                key={goal.id}
                goal={goal}
                compact
                onPress={() => router.push('/savings')}
              />
            ))}
            <TouchableOpacity
              style={[styles.newGoalChip, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/savings')}
              activeOpacity={0.75}
            >
              <View style={[styles.newGoalPlus, { backgroundColor: colors.primary + '18' }]}>
                <Feather name="plus" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.newGoalText, { color: colors.mutedForeground }]}>New{'\n'}Goal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.txSection}>
        <View style={styles.txHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Feather name="inbox" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions yet</Text>
          </View>
        ) : (
          <View style={[styles.txList, { backgroundColor: colors.card }]}>
            {recent.map((tx, i) => (
              <View key={tx.id}>
                <TransactionItem tx={tx} />
                {i < recent.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginBottom: 2,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  cardWrap: {
    marginBottom: 20,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  promo: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  promoTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#fff',
    marginBottom: 4,
  },
  promoSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  savingsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  savingsSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 1,
  },
  newGoalChip: {
    width: 90,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  newGoalPlus: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newGoalText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    textAlign: 'center',
  },
  txSection: {
    paddingHorizontal: 16,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  seeAll: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  txList: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  divider: {
    height: 1,
    marginLeft: 72,
  },
  emptyState: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
});
