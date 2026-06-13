import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { TransactionItem } from '@/components/TransactionItem';
import { Transaction, useWallet } from '@/context/WalletContext';
import { useColors } from '@/hooks/useColors';

type Filter = 'all' | 'credit' | 'debit';

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions } = useWallet();
  const [filter, setFilter] = useState<Filter>('all');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  const TABS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'credit', label: 'Credit' },
    { key: 'debit', label: 'Debit' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Transactions</Text>
        <TouchableOpacity
          style={[styles.analyticsBtn, { backgroundColor: colors.card }]}
          onPress={() => router.push('/analytics')}
          activeOpacity={0.75}
        >
          <Feather name="bar-chart-2" size={18} color={colors.primary} />
          <Text style={[styles.analyticsBtnText, { color: colors.primary }]}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}>
          <Feather name="arrow-down-circle" size={20} color="#16A34A" />
          <View>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={[styles.summaryAmount, { color: '#16A34A' }]}>
              ₦{totalCredit.toLocaleString('en-NG', { minimumFractionDigits: 0 })}
            </Text>
          </View>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FEF2F2' }]}>
          <Feather name="arrow-up-circle" size={20} color="#DC2626" />
          <View>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={[styles.summaryAmount, { color: '#DC2626' }]}>
              ₦{totalDebit.toLocaleString('en-NG', { minimumFractionDigits: 0 })}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { backgroundColor: colors.muted }]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              filter === tab.key && { backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
            ]}
            onPress={() => setFilter(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === tab.key ? colors.primary : colors.mutedForeground },
                filter === tab.key && { fontFamily: 'Inter_600SemiBold' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList<Transaction>
        data={filtered}
        keyExtractor={t => t.id}
        renderItem={({ item, index }) => (
          <View>
            <TransactionItem
              tx={item}
              onPress={() => router.push({ pathname: '/receipt', params: { id: item.id } })}
            />
            {index < filtered.length - 1 && (
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions found</Text>
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 100 },
          filtered.length === 0 && { flex: 1 },
        ]}
        style={[styles.list, { backgroundColor: colors.card }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    letterSpacing: -0.3,
  },
  analyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  analyticsBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  summaryAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  list: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  listContent: {},
  divider: {
    height: 1,
    marginLeft: 72,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
});
