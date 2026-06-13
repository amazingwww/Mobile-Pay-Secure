import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { useBiometric } from '@/hooks/useBiometric';
import { useNotifications } from '@/hooks/useNotifications';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const {
    isEnabled: bioEnabled,
    setEnabled: setBioEnabled,
    canUseBiometric,
    biometricType,
    isLoading: bioLoading,
    authenticate,
  } = useBiometric();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('') ?? 'AO';

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Guudees?',
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

  const handleBiometricToggle = async (val: boolean) => {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Biometric login is only available on iOS and Android.');
      return;
    }
    if (!canUseBiometric) {
      Alert.alert(
        'Not available',
        'Your device doesn\'t have biometric authentication set up. Please enrol in your device settings first.'
      );
      return;
    }
    if (val) {
      // Verify identity before enabling
      const ok = await authenticate();
      if (ok) {
        await setBioEnabled(true);
        const label = biometricType === 'face' ? 'Face ID' : 'Fingerprint';
        Alert.alert(`${label} enabled`, `You can now log in with ${label}.`);
      } else {
        Alert.alert('Authentication failed', 'Biometric login was not enabled.');
      }
    } else {
      await setBioEnabled(false);
    }
  };

  const biometricLabel = bioLoading
    ? 'Checking...'
    : !canUseBiometric && Platform.OS !== 'web'
    ? 'Not available on this device'
    : biometricType === 'face'
    ? 'Face ID'
    : biometricType === 'fingerprint'
    ? 'Fingerprint'
    : 'Fingerprint or Face ID';

  const {
    isEnabled: notifEnabled,
    isLoading: notifLoading,
    toggle: toggleNotif,
  } = useNotifications();

  const handleNotifToggle = async (val: boolean) => {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Push notifications are only available on iOS and Android.');
      return;
    }
    const result = await toggleNotif(val);
    if (val && !result) {
      Alert.alert(
        'Permission denied',
        'Please enable notifications for Guudees in your device Settings to receive alerts.'
      );
    }
  };

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

        {/* Account Section */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Account</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
            {[
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
                sub: user?.tier === 'Tier 2' ? 'Verified ✓' : 'Upgrade to Tier 2',
                color: user?.tier === 'Tier 2' ? '#16A34A' : undefined,
                onPress: () =>
                  user?.tier === 'Tier 2'
                    ? Alert.alert('Verified', 'Your account is fully verified (Tier 2).')
                    : router.push('/kyc'),
              },
            ].map((item, i, arr) => (
              <View key={i}>
                <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.7}>
                  <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
                    <Feather name={item.icon as any} size={18} color={colors.foreground} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                    {item.sub && (
                      <Text style={[styles.menuSub, { color: (item as any).color ?? colors.mutedForeground }]}>{item.sub}</Text>
                    )}
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))}
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Security</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
            {/* Change PIN */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => Alert.alert('Coming Soon', 'PIN change is coming soon.')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
                <Feather name="lock" size={18} color={colors.foreground} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Change PIN</Text>
                <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>Update your 4-digit PIN</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Biometric Toggle */}
            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
                <Feather
                  name={biometricType === 'face' ? 'smile' : 'smartphone'}
                  size={18}
                  color={colors.foreground}
                />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Biometric Login</Text>
                <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{biometricLabel}</Text>
              </View>
              <Switch
                value={bioEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={bioEnabled ? colors.primary : colors.mutedForeground}
                disabled={bioLoading}
                ios_backgroundColor={colors.border}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Notifications Toggle */}
            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
                <Feather name="bell" size={18} color={colors.foreground} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Transaction Alerts</Text>
                <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>
                  {Platform.OS === 'web'
                    ? 'Available on iOS & Android'
                    : notifEnabled
                    ? 'Enabled — transfers, bills, airtime'
                    : 'Get notified for every payment'}
                </Text>
              </View>
              <Switch
                value={notifEnabled}
                onValueChange={handleNotifToggle}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={notifEnabled ? colors.primary : colors.mutedForeground}
                disabled={notifLoading || Platform.OS === 'web'}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Support</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
            {[
              {
                icon: 'help-circle',
                label: 'Help Center',
                onPress: () => Alert.alert('Help Center', 'For support, call 0800-GUUDEES or email support@guudees.ng'),
              },
              {
                icon: 'message-square',
                label: 'Live Chat',
                onPress: () => Alert.alert('Live Chat', 'Our agents are available 24/7. Feature coming soon.'),
              },
            ].map((item, i, arr) => (
              <View key={i}>
                <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.7}>
                  <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
                    <Feather name={item.icon as any} size={18} color={colors.foreground} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </View>
            ))}
          </View>
        </View>

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
          Guudees v1.0.0 {'\u2022'} CBN Regulated
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  avatarInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
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
    fontSize: 12,
  },
  acctCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  acctCardLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  acctCardNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 4,
  },
  acctCardBank: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  menuSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    minHeight: 60,
  },
  menuIcon: {
    width: 36,
    height: 36,
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
    fontSize: 15,
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
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
