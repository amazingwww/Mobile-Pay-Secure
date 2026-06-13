import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TxCategory, useWallet } from '@/context/WalletContext';
import { useColors } from '@/hooks/useColors';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n.toLocaleString()}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CAT_META: Record<TxCategory, { label: string; icon: string; color: string }> = {
  transfer: { label: 'Transfers',   icon: 'arrow-right',       color: '#4F46E5' },
  airtime:  { label: 'Airtime',     icon: 'phone',             color: '#EA580C' },
  data:     { label: 'Data',        icon: 'wifi',              color: '#0284C7' },
  bill:     { label: 'Bills',       icon: 'zap',               color: '#D97706' },
  deposit:  { label: 'Income',      icon: 'arrow-down-circle', color: '#16A34A' },
};

// ─── sub-charts ─────────────────────────────────────────────────────────────

/** 6-month bar chart */
function BarChart({ data }: { data: { label: string; spend: number; income: number }[] }) {
  const colors = useColors();
  const W = 340;
  const H = 160;
  const PAD_L = 40;
  const PAD_B = 28;
  const barW = 16;
  const gap = 8;
  const maxVal = Math.max(...data.flatMap(d => [d.spend, d.income]), 1);
  const chartH = H - PAD_B;
  const slotW = (W - PAD_L) / data.length;

  return (
    <Svg width={W} height={H}>
      {/* y-axis guide lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = chartH * (1 - pct);
        return (
          <G key={pct}>
            <Line
              x1={PAD_L} y1={y} x2={W} y2={y}
              stroke={colors.border} strokeWidth={0.8} strokeDasharray="3,3"
            />
            <SvgText
              x={PAD_L - 4} y={y + 4}
              fontSize={9} fill={colors.mutedForeground} textAnchor="end"
            >
              {fmt(maxVal * pct)}
            </SvgText>
          </G>
        );
      })}

      {/* bars */}
      {data.map((d, i) => {
        const cx = PAD_L + slotW * i + slotW / 2;
        const spendH = (d.spend / maxVal) * chartH;
        const incomeH = (d.income / maxVal) * chartH;
        return (
          <G key={i}>
            {/* income bar */}
            <Rect
              x={cx - barW - gap / 2}
              y={chartH - incomeH}
              width={barW} height={Math.max(incomeH, 2)}
              rx={4} fill="#16A34A" opacity={0.75}
            />
            {/* spend bar */}
            <Rect
              x={cx + gap / 2}
              y={chartH - spendH}
              width={barW} height={Math.max(spendH, 2)}
              rx={4} fill="#4F46E5" opacity={0.85}
            />
            {/* month label */}
            <SvgText
              x={cx} y={H - 6}
              fontSize={10} fill={colors.mutedForeground} textAnchor="middle"
            >
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

/** Donut chart — stacked strokeDasharray arcs */
function DonutChart({ slices }: { slices: { color: string; pct: number }[] }) {
  const R = 64;
  const CX = 80;
  const CY = 80;
  const STROKE = 22;
  const CIRCUMFERENCE = 2 * Math.PI * R;
  const GAP = 2; // gap in px between slices

  let offset = 0;
  const rects: { color: string; dash: number; gap: number; off: number }[] = [];

  slices.forEach(s => {
    const arcLen = Math.max(s.pct * CIRCUMFERENCE - GAP, 0);
    rects.push({ color: s.color, dash: arcLen, gap: CIRCUMFERENCE - arcLen, off: -offset });
    offset += s.pct * CIRCUMFERENCE;
  });

  return (
    <Svg width={160} height={160}>
      <G rotation="-90" origin={`${CX},${CY}`}>
        {rects.map((r, i) => (
          <Circle
            key={i}
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={r.color}
            strokeWidth={STROKE}
            strokeDasharray={`${r.dash} ${r.gap}`}
            strokeDashoffset={r.off}
            strokeLinecap="butt"
          />
        ))}
      </G>
    </Svg>
  );
}

// ─── main screen ────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions } = useWallet();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // Month picker: 0 = current month, -1 = prev, -2 = 2 months ago, etc.
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  const selectedDate = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return d;
  }, [monthOffset]);

  const selectedLabel = `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  // Transactions for selected month
  const monthTxs = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    });
  }, [transactions, selectedDate]);

  const monthIncome = useMemo(() => monthTxs.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0), [monthTxs]);
  const monthSpend  = useMemo(() => monthTxs.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0), [monthTxs]);
  const savingsRate = monthIncome > 0 ? Math.max(0, Math.round(((monthIncome - monthSpend) / monthIncome) * 100)) : 0;

  // 6-month bar data
  const barData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const offset = -(5 - i);
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const txs = transactions.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      return {
        label: MONTHS[d.getMonth()],
        spend:  txs.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0),
        income: txs.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions]);

  // Category breakdown for selected month (debits only)
  const catBreakdown = useMemo(() => {
    const debitTxs = monthTxs.filter(t => t.type === 'debit');
    const total = debitTxs.reduce((s, t) => s + t.amount, 0);
    const map: Record<string, number> = {};
    debitTxs.forEach(t => { map[t.category] = (map[t.category] ?? 0) + t.amount; });
    return Object.entries(map)
      .map(([cat, amount]) => ({
        cat: cat as TxCategory,
        amount,
        pct: total > 0 ? amount / total : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthTxs]);

  const donutSlices = catBreakdown.map(c => ({ color: CAT_META[c.cat]?.color ?? '#888', pct: c.pct }));
  const hasSpend = catBreakdown.length > 0;

  // Top 3 biggest debit transactions for selected month
  const topTxs = useMemo(() => {
    return [...monthTxs]
      .filter(t => t.type === 'debit')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [monthTxs]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Analytics</Text>
        {/* Month picker */}
        <View style={styles.monthPicker}>
          <TouchableOpacity
            onPress={() => setMonthOffset(o => Math.max(o - 1, -11))}
            activeOpacity={0.7}
            style={styles.monthArrow}
          >
            <Feather name="chevron-left" size={18} color={monthOffset > -11 ? colors.primary : colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: colors.foreground }]}>{selectedLabel}</Text>
          <TouchableOpacity
            onPress={() => setMonthOffset(o => Math.min(o + 1, 0))}
            activeOpacity={0.7}
            style={styles.monthArrow}
          >
            <Feather name="chevron-right" size={18} color={monthOffset < 0 ? colors.primary : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: botPad + 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Summary cards ── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}>
            <Feather name="arrow-down-circle" size={18} color="#16A34A" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryLabel, { color: '#16A34A' }]}>Income</Text>
              <Text style={[styles.summaryAmt, { color: '#15803D' }]}>{fmt(monthIncome)}</Text>
            </View>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#EEF2FF' }]}>
            <Feather name="arrow-up-circle" size={18} color="#4F46E5" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryLabel, { color: '#4F46E5' }]}>Spent</Text>
              <Text style={[styles.summaryAmt, { color: '#4338CA' }]}>{fmt(monthSpend)}</Text>
            </View>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FFFBEB' }]}>
            <Feather name="trending-up" size={18} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryLabel, { color: '#D97706' }]}>Saved</Text>
              <Text style={[styles.summaryAmt, { color: '#B45309' }]}>{savingsRate}%</Text>
            </View>
          </View>
        </View>

        {/* ── 6-month bar chart ── */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>6-Month Overview</Text>
            <View style={styles.legend}>
              <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Income</Text>
              <View style={[styles.legendDot, { backgroundColor: '#4F46E5', marginLeft: 8 }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Spend</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart data={barData} />
          </ScrollView>
        </View>

        {/* ── Category donut + breakdown ── */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Spending Breakdown</Text>
          {!hasSpend ? (
            <View style={styles.emptyState}>
              <Feather name="pie-chart" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No spending data for {selectedLabel}</Text>
            </View>
          ) : (
            <View style={styles.donutRow}>
              {/* Donut */}
              <View style={styles.donutWrap}>
                <DonutChart slices={donutSlices} />
                {/* centre label */}
                <View style={styles.donutCenter} pointerEvents="none">
                  <Text style={[styles.donutAmt, { color: colors.foreground }]}>{fmt(monthSpend)}</Text>
                  <Text style={[styles.donutSub, { color: colors.mutedForeground }]}>total</Text>
                </View>
              </View>

              {/* Legend */}
              <View style={styles.donutLegend}>
                {catBreakdown.map(({ cat, amount, pct }) => {
                  const meta = CAT_META[cat] ?? { label: cat, color: '#888' };
                  return (
                    <View key={cat} style={styles.donutLegendRow}>
                      <View style={[styles.donutLegendDot, { backgroundColor: meta.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.donutLegendLabel, { color: colors.foreground }]}>{meta.label}</Text>
                        <Text style={[styles.donutLegendAmt, { color: colors.mutedForeground }]}>{fmt(amount)}</Text>
                      </View>
                      <Text style={[styles.donutLegendPct, { color: meta.color }]}>{Math.round(pct * 100)}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* ── Top spends ── */}
        {topTxs.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Biggest Spends</Text>
            {topTxs.map((tx, i) => {
              const meta = CAT_META[tx.category];
              return (
                <View
                  key={tx.id}
                  style={[
                    styles.topRow,
                    i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  ]}
                >
                  <View style={[styles.topRank, { backgroundColor: meta?.color + '18' ?? '#f3f4f6' }]}>
                    <Text style={[styles.topRankText, { color: meta?.color ?? '#888' }]}>#{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.topDesc, { color: colors.foreground }]} numberOfLines={1}>{tx.description}</Text>
                    <Text style={[styles.topParty, { color: colors.mutedForeground }]} numberOfLines={1}>{tx.party}</Text>
                  </View>
                  <Text style={[styles.topAmt, { color: colors.foreground }]}>₦{tx.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Net position ── */}
        <View style={[styles.netCard, { backgroundColor: monthIncome >= monthSpend ? '#F0FDF4' : '#FEF2F2' }]}>
          <Feather
            name={monthIncome >= monthSpend ? 'trending-up' : 'trending-down'}
            size={22}
            color={monthIncome >= monthSpend ? '#16A34A' : '#DC2626'}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.netLabel, { color: monthIncome >= monthSpend ? '#15803D' : '#B91C1C' }]}>
              {monthIncome >= monthSpend ? 'Net positive month' : 'Spending exceeds income'}
            </Text>
            <Text style={[styles.netAmt, { color: monthIncome >= monthSpend ? '#16A34A' : '#DC2626' }]}>
              {monthIncome >= monthSpend ? '+' : '-'}₦{Math.abs(monthIncome - monthSpend).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 8,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, flex: 1, marginLeft: 4 },

  monthPicker: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  monthArrow: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, minWidth: 72, textAlign: 'center' },

  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  summaryLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, marginBottom: 2 },
  summaryAmt: { fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: -0.3 },

  card: {
    borderRadius: 20, padding: 18, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: 'Inter_400Regular', fontSize: 11 },

  emptyState: { alignItems: 'center', padding: 28, gap: 10 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center' },

  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  donutWrap: { width: 160, height: 160, position: 'relative' },
  donutCenter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  donutAmt: { fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.5 },
  donutSub: { fontFamily: 'Inter_400Regular', fontSize: 11 },

  donutLegend: { flex: 1, gap: 10 },
  donutLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  donutLegendDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  donutLegendLabel: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  donutLegendAmt: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  donutLegendPct: { fontFamily: 'Inter_700Bold', fontSize: 13 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  topRank: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  topRankText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  topDesc: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  topParty: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  topAmt: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  netCard: {
    borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  netLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, marginBottom: 3 },
  netAmt: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.5 },
});
