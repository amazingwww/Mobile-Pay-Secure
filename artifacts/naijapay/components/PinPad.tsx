import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type Props = {
  onPress: (digit: string) => void;
  onDelete: () => void;
};

const KEYS: { digit: string; letters: string }[] = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '', letters: '' },
  { digit: '0', letters: '+' },
  { digit: 'del', letters: '' },
];

function KeyButton({ item, onPress, onDelete }: { item: typeof KEYS[0]; onPress: (d: string) => void; onDelete: () => void }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (item.digit === '') return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 60, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.digit === 'del') onDelete();
    else onPress(item.digit);
  };

  if (item.digit === '') return <View style={styles.phantom} />;

  const isDel = item.digit === 'del';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          styles.key,
          {
            backgroundColor: isDel ? colors.secondary : colors.card,
            borderColor: isDel ? colors.border : colors.border,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.75}
      >
        {isDel ? (
          <Feather name="delete" size={22} color={colors.primary} />
        ) : (
          <View style={styles.keyInner}>
            <Text style={[styles.digit, { color: colors.foreground }]}>{item.digit}</Text>
            {item.letters ? (
              <Text style={[styles.letters, { color: colors.mutedForeground }]}>{item.letters}</Text>
            ) : null}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function PinPad({ onPress, onDelete }: Props) {
  return (
    <View style={styles.grid}>
      {KEYS.map((item, i) => (
        <KeyButton key={i} item={item} onPress={onPress} onDelete={onDelete} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 28,
  },
  phantom: {
    width: 80,
    height: 68,
  },
  key: {
    width: 80,
    height: 68,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  keyInner: {
    alignItems: 'center',
    gap: 1,
  },
  digit: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  letters: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    letterSpacing: 1.2,
    lineHeight: 11,
  },
});
