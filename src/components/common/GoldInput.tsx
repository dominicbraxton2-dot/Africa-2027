import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  icon?: string;
  suffix?: string;
  rightAction?: { label: string; onPress: () => void };
}

export function GoldInput({
  label,
  error,
  containerStyle,
  icon,
  suffix,
  rightAction,
  ...props
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          focused && styles.focused,
          error ? styles.errorBorder : null,
        ]}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          {...props}
          style={[styles.input, props.style]}
          placeholderTextColor={Colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.rightAction}>
            <Text style={styles.rightActionText}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  focused: {
    borderColor: Colors.gold,
  },
  errorBorder: {
    borderColor: Colors.error,
  },
  icon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    paddingVertical: Spacing.md,
  },
  suffix: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    marginLeft: Spacing.sm,
  },
  rightAction: {
    marginLeft: Spacing.sm,
  },
  rightActionText: {
    color: Colors.gold,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  error: {
    color: Colors.error,
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
  },
});
