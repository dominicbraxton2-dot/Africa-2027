import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: { icon?: string; label?: string; onPress: () => void };
  showDivider?: boolean;
}

export function ScreenHeader({ title, subtitle, onBack, rightAction, showDivider = true }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />
      <View style={styles.row}>
        <View style={styles.left}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
        <View style={styles.right}>
          {rightAction && (
            <TouchableOpacity onPress={rightAction.onPress} style={styles.rightBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              {rightAction.icon ? (
                <Text style={styles.rightIcon}>{rightAction.icon}</Text>
              ) : (
                <Text style={styles.rightLabel}>{rightAction.label}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
      {showDivider && <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  backIcon: {
    color: Colors.gold,
    fontSize: 22,
    fontWeight: '600',
  },
  rightBtn: {
    padding: Spacing.xs,
  },
  rightIcon: {
    fontSize: 22,
  },
  rightLabel: {
    color: Colors.gold,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderColor,
    marginTop: Spacing.sm,
  },
});
