import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

export default function ReceiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleCopy = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: topPad, paddingBottom: bottomPad }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Receive Money</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* QR Visual */}
        <View style={[styles.qrCard, { backgroundColor: colors.card }]}>
          <View style={[styles.qrOuter, { borderColor: colors.primary }]}>
            <View style={styles.qrInner}>
              {/* Decorative QR-like pattern */}
              <View style={styles.qrGrid}>
                {Array.from({ length: 7 }).map((_, row) =>
                  Array.from({ length: 7 }).map((_, col) => {
                    const isCorner =
                      (row < 2 && col < 2) ||
                      (row < 2 && col > 4) ||
                      (row > 4 && col < 2);
                    const isCenter = row === 3 && col === 3;
                    const isDot = (row + col) % 3 === 0;
                    return (
                      <View
                        key={`${row}-${col}`}
                        style={[
                          styles.qrCell,
                          {
                            backgroundColor:
                              isCorner || isCenter || isDot
                                ? colors.primary
                                : 'transparent',
                            borderRadius: isCorner ? 2 : 1,
                          },
                        ]}
                      />
                    );
                  })
                )}
              </View>
            </View>
          </View>

          <Text style={[styles.acctName, { color: colors.foreground }]}>{user?.accountName}</Text>
          <Text style={[styles.bankName, { color: colors.mutedForeground }]}>{user?.bankName}</Text>
        </View>

        {/* Account Details Card */}
        <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Account Number</Text>
            <View style={styles.detailValueRow}>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>{user?.accountNumber}</Text>
              <TouchableOpacity
                style={[styles.copyBtn, { backgroundColor: copied ? '#D1FAE5' : colors.secondary }]}
                onPress={handleCopy}
                activeOpacity={0.7}
              >
                <Feather name={copied ? 'check' : 'copy'} size={14} color={copied ? '#10B981' : colors.primary} />
                <Text style={[styles.copyText, { color: copied ? '#10B981' : colors.primary }]}>
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Provider</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>{user?.bankName}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Account Name</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>{user?.accountName}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Account Tier</Text>
            <View style={[styles.tierBadge, { backgroundColor: colors.secondary }]}>
              <Feather name="check-circle" size={12} color={colors.primary} />
              <Text style={[styles.tierText, { color: colors.primary }]}>{user?.tier}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Share your account number with anyone to receive transfers from any Nigerian institution
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 16,
  },
  qrCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  qrOuter: {
    borderWidth: 3,
    borderRadius: 16,
    padding: 12,
  },
  qrInner: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  qrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 140,
    height: 140,
  },
  qrCell: {
    width: 20,
    height: 20,
    margin: 0,
  },
  acctName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  bankName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  detailCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  detailLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tierText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});
