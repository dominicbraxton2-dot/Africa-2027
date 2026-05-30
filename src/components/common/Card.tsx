import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'gold' | 'dark' | 'green' | 'glass';
  padding?: number;
}

export function Card({ children, style, variant = 'default', padding = Spacing.base }: Props) {
  return (
    <View
      style={[
        styles.card,
        variant === 'gold' && styles.goldCard,
        variant === 'dark' && styles.darkCard,
        variant === 'green' && styles.greenCard,
        variant === 'glass' && styles.glassCard,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    ...Shadows.dark,
  },
  goldCard: {
    backgroundColor: Colors.cardBg,
    borderColor: Colors.gold + '50',
    borderTopWidth: 2,
    borderTopColor: Colors.gold + '80',
    ...Shadows.gold,
  },
  darkCard: {
    backgroundColor: Colors.darkGray,
    borderColor: Colors.borderColor,
  },
  greenCard: {
    backgroundColor: Colors.safariGreenDark,
    borderColor: Colors.safariGreenLight + '60',
    ...Shadows.green,
  },
  glassCard: {
    backgroundColor: Colors.safariGreen + '20',
    borderColor: Colors.gold + '30',
    borderWidth: 1,
    ...Shadows.dark,
  },
});
