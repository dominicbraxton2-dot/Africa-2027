import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'gold' | 'dark';
  padding?: number;
}

export function Card({ children, style, variant = 'default', padding = Spacing.base }: Props) {
  return (
    <View
      style={[
        styles.card,
        variant === 'gold' && styles.goldCard,
        variant === 'dark' && styles.darkCard,
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
    borderColor: Colors.gold + '60',
    backgroundColor: Colors.cardBg,
  },
  darkCard: {
    backgroundColor: Colors.darkGray,
    borderColor: Colors.borderColor,
  },
});
