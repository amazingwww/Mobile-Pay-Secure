import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  balance: number;
  accountNumber: string;
  accountName: string;
  bankName: string;
};

function formatBalance(n: number) {
  return n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BalanceCard({ balance, accountNumber, accountName, bankName }: Props) {
  const [visible, setVisible] = useState(true);

  const maskedAccount = accountNumber.replace(/(\d{4})(\d{2})(\d{4})/, '$1 $2** ****');

  return (
    <LinearGradient
      colors={['#0A1E4D', '#1E3A8A', '#2563EB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* dot pattern overlay */}
      <View style={styles.dotPattern} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </View>

      <View style={styles.topRow}>
        <View style={styles.logoRow}>
          <Image
            source={require('@/assets/images/guudees-logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <View style={styles.chipIcon}>
          <Feather name="wifi" size={18} color="rgba(255,255,255,0.5)" />
        </View>
      </View>

      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.currency}>₦</Text>
          <Text style={styles.balanceAmount}>
            {visible ? formatBalance(balance) : '••••••••'}
          </Text>
          <TouchableOpacity onPress={() => setVisible(v => !v)} style={styles.eyeBtn}>
            <Feather name={visible ? 'eye' : 'eye-off'} size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.accountLabel}>Account Number</Text>
          <Text style={styles.accountNumber}>{maskedAccount}</Text>
        </View>
        <Text style={styles.accountName}>{accountName}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 22,
    marginHorizontal: 16,
    height: 200,
    justifyContent: 'space-between',
    shadowColor: '#0A1E4D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  dotPattern: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 60,
    gap: 6,
    opacity: 0.15,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F2B705',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImg: {
    width: 100,
    height: 32,
    tintColor: '#fff',
  },
  chipIcon: { opacity: 0.7 },
  balanceSection: { alignItems: 'flex-start' },
  balanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currency: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    marginTop: 2,
  },
  balanceAmount: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    letterSpacing: -0.5,
  },
  eyeBtn: {
    marginLeft: 8,
    padding: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  accountLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  accountNumber: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 1,
    marginTop: 2,
  },
  accountName: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
