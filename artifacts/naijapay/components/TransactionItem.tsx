import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Transaction, TxCategory } from '@/context/WalletContext';

function formatAmount(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getCategoryIcon(cat: TxCategory): { name: string; bg: string; color: string } {
  switch (cat) {
    case 'transfer': return { name: 'arrow-right', bg: '#EEF2FF', color: '#4F46E5' };
    case 'airtime': return { name: 'phone', bg: '#FFF7ED', color: '#EA580C' };
    case 'data': return { name: 'wifi', bg: '#F0F9FF', color: '#0284C7' };
    case 'bill': return { name: 'zap', bg: '#FFFBEB', color: '#D97706' };
    case 'deposit': return { name: 'arrow-down-circle', bg: '#F0FDF4', color: '#16A34A' };
    default: return { name: 'circle', bg: '#F3F4F6', color: '#6B7280' };
  }
}

type Props = {
  tx: Transaction;
  onPress?: () => void;
};

export function TransactionItem({ tx, onPress }: Props) {
  const colors = useColors();
  const icon = getCategoryIcon(tx.category);
  const isCredit = tx.type === 'credit';

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      disabled={!onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
        <Feather name={icon.name as any} size={18} color={icon.color} />
      </View>
      <View style={styles.middle}>
        <Text style={[styles.desc, { color: colors.foreground }]} numberOfLines={1}>
          {tx.description}
        </Text>
        <Text style={[styles.party, { color: colors.mutedForeground }]} numberOfLines={1}>
          {tx.party}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: isCredit ? '#10B981' : colors.foreground }]}>
          {isCredit ? '+' : '-'}₦{formatAmount(tx.amount)}
        </Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>{formatDate(tx.date)}</Text>
      </View>
      {onPress && (
        <Feather name="chevron-right" size={14} color={colors.mutedForeground} style={{ marginLeft: 2 }} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  middle: {
    flex: 1,
    gap: 3,
  },
  desc: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  party: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  right: {
    alignItems: 'flex-end',
    gap: 3,
  },
  amount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  date: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
});
