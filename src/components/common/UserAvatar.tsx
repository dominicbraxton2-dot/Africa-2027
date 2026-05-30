import React from 'react';
import { Image, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';
import { Colors } from '../../constants/theme';

interface Props {
  user?: { full_name?: string; avatar_url?: string } | null;
  size?: number;
  style?: ViewStyle;
}

export function UserAvatar({ user, size = 40, style }: Props) {
  const borderRadius = size / 2;
  const fontSize = Math.round(size * 0.38);

  const initials = (user?.full_name || '?')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (user?.avatar_url) {
    return (
      <Image
        source={{ uri: user.avatar_url }}
        style={[{ width: size, height: size, borderRadius }, style]}
        resizeMode="cover"
      />
    );
  }

  return (
    <LinearGradient
      colors={['#F0CC50', '#D4AF37', '#A8860A']}
      style={[{ width: size, height: size, borderRadius, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Text style={{ color: Colors.black, fontSize, fontWeight: '900' }}>{initials}</Text>
    </LinearGradient>
  );
}
