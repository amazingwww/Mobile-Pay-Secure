import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type Props = {
  onPress: (digit: string) => void;
  onDelete: () => void;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function PinPad({ onPress, onDelete }: Props) {
  const colors = useColors();

  const handlePress = (key: string) => {
    if (key === '' ) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (key === 'del') {
      onDelete();
    } else {
      onPress(key);
    }
  };

  return (
    <View style={styles.grid}>
      {KEYS.map((key, i) => (
        <TouchableOpacity
          key={i}
          style={[
            styles.key,
            key === '' && styles.invisible,
            { backgroundColor: key === '' ? 'transparent' : colors.card },
          ]}
          onPress={() => handlePress(key)}
          activeOpacity={0.6}
          disabled={key === ''}
        >
          {key === 'del' ? (
            <Feather name="delete" size={22} color={colors.foreground} />
          ) : (
            <Text style={[styles.keyText, { color: colors.foreground }]}>{key}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  invisible: {
    shadowOpacity: 0,
    elevation: 0,
  },
  keyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 24,
  },
});
