import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SavingsGoal } from '@/context/SavingsContext';
import { useColors } from '@/hooks/useColors';

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n.toLocaleString()}`;
}

function daysLeft(deadline?: string): string | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  if (days < 30) return `${days}d left`;
  const months = Math.floor(days / 30);
  return `${months}mo left`;
}

type Props = {
  goal: SavingsGoal;
  onPress?: () => void;
  compact?: boolean;
};

export function SavingsGoalCard({ goal, onPress, compact }: Props) {
  const colors = useColors();
  const pct = goal.targetAmount > 0 ? Math.min(goal.savedAmount / goal.targetAmount, 1) : 0;
  const pctDisplay = Math.round(pct * 100);
  const remaining = goal.targetAmount - goal.savedAmount;
  const dl = daysLeft(goal.deadline);

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, { backgroundColor: colors.card }]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={[styles.compactEmoji, { backgroundColor: goal.color + '20' }]}>
          <Text style={styles.compactEmojiText}>{goal.emoji}</Text>
        </View>
        <Text style={[styles.compactName, { color: colors.foreground }]} numberOfLines={1}>
          {goal.name}
        </Text>
        <Text style={[styles.compactSaved, { color: goal.color }]}>{fmt(goal.savedAmount)}</Text>
        <Text style={[styles.compactTarget, { color: colors.mutedForeground }]}>of {fmt(goal.targetAmount)}</Text>

        {/* Progress bar */}
        <View style={[styles.compactBar, { backgroundColor: colors.border }]}>
          <View style={[styles.compactBarFill, { width: `${pctDisplay}%` as any, backgroundColor: goal.color }]} />
        </View>
        <Text style={[styles.compactPct, { color: colors.mutedForeground }]}>{pctDisplay}%</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={[styles.emojiBox, { backgroundColor: goal.color + '18' }]}>
          <Text style={styles.emojiText}>{goal.emoji}</Text>
        </View>
        <View style={styles.cardTopMid}>
          <Text style={[styles.goalName, { color: colors.foreground }]}>{goal.name}</Text>
          {dl && (
            <View style={[styles.dlBadge, { backgroundColor: goal.color + '18' }]}>
              <Feather name="clock" size={10} color={goal.color} />
              <Text style={[styles.dlText, { color: goal.color }]}>{dl}</Text>
            </View>
          )}
        </View>
        <View style={styles.pctCircle}>
          <Text style={[styles.pctText, { color: goal.color }]}>{pctDisplay}<Text style={styles.pctSymbol}>%</Text></Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.bar, { backgroundColor: goal.color + '22' }]}>
        <View style={[
          styles.barFill,
          { width: `${pctDisplay}%` as any, backgroundColor: goal.color },
          pctDisplay >= 100 && styles.barFillComplete,
        ]} />
      </View>

      {/* Amounts row */}
      <View style={styles.amountsRow}>
        <View>
          <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Saved</Text>
          <Text style={[styles.amountValue, { color: goal.color }]}>{fmt(goal.savedAmount)}</Text>
        </View>
        <View style={styles.amountCenter}>
          <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Remaining</Text>
          <Text style={[styles.amountValue, { color: colors.foreground }]}>{remaining > 0 ? fmt(remaining) : '—'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Target</Text>
          <Text style={[styles.amountValue, { color: colors.foreground }]}>{fmt(goal.targetAmount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 22 },
  cardTopMid: { flex: 1, gap: 4 },
  goalName: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  dlBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  dlText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  pctCircle: { alignItems: 'flex-end' },
  pctText: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.5 },
  pctSymbol: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  bar: { height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5, minWidth: 4 },
  barFillComplete: { opacity: 0.9 },

  amountsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  amountCenter: { alignItems: 'center' },
  amountLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, marginBottom: 2 },
  amountValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  /* compact (home screen) */
  compactCard: {
    width: 150,
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  compactEmoji: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  compactEmojiText: { fontSize: 18 },
  compactName: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  compactSaved: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 4 },
  compactTarget: { fontFamily: 'Inter_400Regular', fontSize: 11, marginBottom: 8 },
  compactBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  compactBarFill: { height: '100%', borderRadius: 3, minWidth: 4 },
  compactPct: { fontFamily: 'Inter_500Medium', fontSize: 11 },
});
