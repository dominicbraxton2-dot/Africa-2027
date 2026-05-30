import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

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
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.safariGreenDark, Colors.safariGreen, Colors.safariGreenDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" backgroundColor={Colors.safariGreenDark} />
        <View style={styles.row}>
          <View style={styles.left}>
            {onBack && (
              <TouchableOpacity
                onPress={onBack}
                style={styles.backBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.backBtnInner}>
                  <Text style={styles.backIcon}>←</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
          </View>
          <View style={styles.right}>
            {rightAction && (
              <TouchableOpacity
                onPress={rightAction.onPress}
                style={styles.rightBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {rightAction.icon ? (
                  <Text style={styles.rightIcon}>{rightAction.icon}</Text>
                ) : (
                  <Text style={styles.rightLabel}>{rightAction.label}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
        {showDivider && (
          <View style={styles.divider}>
            <LinearGradient
              colors={['transparent', Colors.gold + '80', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dividerLine}
            />
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.safariGreenDark,
  },
  container: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  left: {
    width: 48,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 48,
    alignItems: 'flex-end',
  },
  title: {
    color: Colors.gold,
    fontSize: Typography.sizes.lg,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  backBtnInner: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gold + '20',
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: '700',
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
    fontWeight: '700',
  },
  divider: {
    marginTop: Spacing.sm,
  },
  dividerLine: {
    height: 1,
  },
});
