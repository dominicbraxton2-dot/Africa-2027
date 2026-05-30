import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'outline' | 'ghost' | 'green';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
}

export function GoldButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'solid',
  size = 'md',
  style,
  textStyle,
  icon,
}: Props) {
  const isDisabled = disabled || loading;
  const heights = { sm: 40, md: 52, lg: 60 };
  const fontSizes = { sm: Typography.sizes.sm, md: Typography.sizes.md, lg: Typography.sizes.lg };

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.outline,
          { height: heights[size], opacity: isDisabled ? 0.5 : 1 },
          style,
        ]}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={Colors.gold} />
        ) : (
          <Text style={[styles.outlineText, { fontSize: fontSizes[size] }, textStyle]}>
            {icon ? `${icon}  ` : ''}{title}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.ghost, { height: heights[size], opacity: isDisabled ? 0.5 : 1 }, style]}
        activeOpacity={0.7}
      >
        <Text style={[styles.ghostText, { fontSize: fontSizes[size] }, textStyle]}>
          {icon ? `${icon}  ` : ''}{title}
        </Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'green') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.container, { opacity: isDisabled ? 0.5 : 1 }, style]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[Colors.safariGreenLight, Colors.safariGreen, Colors.safariGreenDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { height: heights[size] }]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.gold} />
          ) : (
            <Text style={[styles.greenText, { fontSize: fontSizes[size] }, textStyle]}>
              {icon ? `${icon}  ` : ''}{title}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.container, { opacity: isDisabled ? 0.5 : 1 }, style]}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={['#F0CC50', '#D4AF37', '#A8860A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { height: heights[size] }]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.black} />
        ) : (
          <Text style={[styles.text, { fontSize: fontSizes[size] }, textStyle]}>
            {icon ? `${icon}  ` : ''}{title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
  },
  text: {
    color: Colors.black,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  greenText: {
    color: Colors.gold,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  outline: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  outlineText: {
    color: Colors.gold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ghost: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
  },
  ghostText: {
    color: Colors.gold,
    fontWeight: '600',
  },
});
