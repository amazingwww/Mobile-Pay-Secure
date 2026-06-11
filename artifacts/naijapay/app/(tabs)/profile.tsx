import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';

type MenuItem = {
  icon: string;
  label: string;
  sub?: string;
  color?: string;
  onPress?: () => void;
  danger?: boolean;
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('') ?? 'AO';

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Zela?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const MENU: { section: string; items: MenuItem[] }[] = [
    {
      section: 'Account',
      items: [
        {
          icon: 'user',
          label: 'Personal Information',
          sub: 'Name, phone, email',
          onPress: () => Alert.alert('Coming Soon', 'Profile editing is coming soon.'),
        },
        {
          icon: 'credit-card',
          label: 'Account Details',
          sub: user?.accountNumber,
          onPress: () => router.push('/receive'),
        },
        {
          icon: 'shield',
          label: 'Verification',
          sub: user?.tier,
          onPress: () => Alert.alert('Verification', 'Your account is ' + user?.tier + ' verified.'),
        },
      ],
    },
    {
      section: 'Security',
      items: [
        {
          icon: 'lock',
          label: 'Change PIN',
          sub: 'Update your 4-digit PIN',
          onPress: () => Alert.alert('Coming Soon', 'PIN change is coming soon.'),
        },
        {
          icon: 'smartphone',
          label: 'Biometric Login',
          sub: 'Fingerprint or Face ID',
          onPress: () => Alert.alert('Coming Soon', 'Biometric login is coming soon.'),
        },
      ],
    },
    {
      section: 'Support',
      items: [
        {
          icon: 'help-circle',
          label: 'Help Center',
          onPress: () => Alert.alert('Help Center', 'For support, call 0800-ZELA or email support@zela.ng'),
        },
        {
          icon: 'message-square',
          label: 'Live Chat',
          onPress: () => Alert.alert('Live Chat', 'Our agents are available 24/7. Feature coming soon.'),
        },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={[styles.avatarSection, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name}</Text>
            <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>{user?.phone}</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: colors.secondary }]}>
            <Feather name="check-circle" size={12} color={colors.primary} />
            <Text style={[styles.tierText, { color: colors.primary }]}>{user?.tier}</Text>
          </View>
        </View>

        {/* Account Number Quick Card */}
        <TouchableOpacity
          style={[styles.acctCard, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/receive')}
          activeOpacity={0.85}
        >
          <View>
            <Text style={styles.acctCardLabel}>Account Number</Text>
            <Text style={styles.acctCardNumber}>{user?.accountNumber}</Text>
            <Text style={styles.acctCardBank}>{user?.bankName}</Text>
          </View>
          <Feather name="copy" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Menu Sections */}
        {MENU.map(section => (
          <View key={section.section} style={styles.menuSection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{section.section}</Text>
            <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
              {section.items.map((item, i) => (
                <View key={i}>
                  <TouchableOpacity
                    style={styles.menuRow}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
                      <Feather name={item.icon as any} size={18} color={item.danger ? colors.destructive : colors.foreground} />
                    </View>
                    <View style={styles.menuText}>
                      <Text style={[styles.menuLabel, { color: item.danger ? colors.destructive : colors.foreground }]}>
                        {item.label}
                      </Text>
                      {item.sub && (
                        <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                      )}
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  {i < section.items.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <View style={styles.menuSection}>
          <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
            <TouchableOpacity style={styles.menuRow} onPress={handleLogout} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: '#FEF2F2' }]}>
                <Feather name="log-out" size={18} color={colors.destructive} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, { color: colors.destructive }]}>Log Out</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          Zela v1.0.0 {'\u2022'} CBN Licensed
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    letterSpacing: -0.3,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  avatarInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  userPhone: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
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
  acctCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  acctCardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  acctCardNumber: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    letterSpacing: 2,
    marginBottom: 4,
  },
  acctCardBank: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  menuSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginLeft: 66,
  },
  version: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginVertical: 16,
  },
});
