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
import { useColors } from '@/hooks/useColors';

type Service = {
  icon: string;
  label: string;
  color: string;
  bg: string;
  route?: string;
  comingSoon?: boolean;
};

const SERVICES: Service[] = [
  { icon: 'phone', label: 'Airtime', color: '#EA580C', bg: '#FFF7ED', route: '/airtime' },
  { icon: 'wifi', label: 'Data', color: '#0284C7', bg: '#F0F9FF', route: '/data' },
  { icon: 'zap', label: 'Electricity', color: '#D97706', bg: '#FFFBEB', comingSoon: false, route: '/bill-payment?type=electricity' },
  { icon: 'tv', label: 'Cable TV', color: '#7C3AED', bg: '#F5F3FF', comingSoon: false, route: '/bill-payment?type=cable' },
  { icon: 'droplet', label: 'Water', color: '#0891B2', bg: '#ECFEFF', comingSoon: true },
  { icon: 'globe', label: 'Internet', color: '#059669', bg: '#F0FDF4', comingSoon: true },
  { icon: 'award', label: 'Betting', color: '#DC2626', bg: '#FEF2F2', comingSoon: true },
  { icon: 'book', label: 'Education', color: '#7C3AED', bg: '#F5F3FF', comingSoon: true },
  { icon: 'heart', label: 'Insurance', color: '#BE185D', bg: '#FDF2F8', comingSoon: true },
  { icon: 'more-horizontal', label: 'More', color: '#6B7280', bg: '#F3F4F6', comingSoon: true },
];

export default function PayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleService = (svc: Service) => {
    if (svc.comingSoon) return;
    if (svc.route) router.push(svc.route as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Pay Bills</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Fast, secure payments at your fingertips
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 120 : insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {SERVICES.map((svc, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.serviceCard, { backgroundColor: colors.card }]}
              onPress={() => handleService(svc)}
              activeOpacity={svc.comingSoon ? 1 : 0.7}
            >
              <View style={[styles.serviceIcon, { backgroundColor: svc.bg }]}>
                <Feather name={svc.icon as any} size={24} color={svc.color} />
              </View>
              <Text style={[styles.serviceLabel, { color: colors.foreground }]}>{svc.label}</Text>
              {svc.comingSoon && (
                <View style={[styles.soonBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.soonText, { color: colors.mutedForeground }]}>Soon</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Promotions */}
        <View style={[styles.promoCard, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
          <Feather name="percent" size={22} color="#EA580C" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.promoTitle, { color: '#C2410C' }]}>Zero fees on all bill payments</Text>
            <Text style={[styles.promoSub, { color: '#9A3412' }]}>NaijaPay charges no fees on electricity, cable, and more</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  serviceCard: {
    width: '30%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  serviceIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    textAlign: 'center',
  },
  soonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  soonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  promoTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginBottom: 4,
  },
  promoSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
});
