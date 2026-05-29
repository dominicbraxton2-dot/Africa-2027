import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { GoldButton } from '../../components/common/GoldButton';
import { GoldInput } from '../../components/common/GoldInput';
import { useAuthStore } from '../../store/authStore';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuthStore();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { error } = mode === 'login'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, fullName.trim());

      if (error) {
        Alert.alert('Error', error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.black, Colors.darkGray, '#1A1008']}
        style={StyleSheet.absoluteFill}
      />
      {/* Decorative gold lines */}
      <View style={styles.topAccent} />
      <View style={styles.bottomAccent} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>✈️</Text>
            <Text style={styles.tagline}>ANDRETTA'S</Text>
            <Text style={styles.title}>40th Birthday{'\n'}Expedition</Text>
            <View style={styles.divider} />
            <Text style={styles.destinations}>🇹🇿 Zanzibar  •  🇿🇦 Cape Town</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.tabRow}>
              {(['login', 'register'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setMode(t)}
                  style={[styles.tab, mode === t && styles.activeTab]}
                >
                  <Text style={[styles.tabText, mode === t && styles.activeTabText]}>
                    {t === 'login' ? 'Sign In' : 'Join Trip'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {mode === 'register' && (
              <GoldInput
                label="Full Name"
                placeholder="Your full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                icon="👤"
              />
            )}

            <GoldInput
              label="Email Address"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon="✉️"
            />

            <GoldInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon="🔒"
            />

            <GoldButton
              title={mode === 'login' ? 'Enter the Expedition' : 'Join the Adventure'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
              size="lg"
            />

            <Text style={styles.hint}>
              {mode === 'login'
                ? 'New traveler? '
                : 'Already have access? '}
              <Text style={styles.hintLink} onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Join the trip' : 'Sign in'}
              </Text>
            </Text>
          </View>

          <Text style={styles.footer}>Private • Secure • Celebratory</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  flex: { flex: 1 },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.gold,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.gold + '40',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  emoji: {
    fontSize: 56,
    marginBottom: Spacing.base,
  },
  tagline: {
    color: Colors.gold,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    letterSpacing: 6,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes['3xl'],
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 38,
    marginTop: Spacing.sm,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: Colors.gold,
    marginVertical: Spacing.base,
    opacity: 0.6,
  },
  destinations: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    letterSpacing: 1,
  },
  form: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    padding: Spacing.xl,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surfaceBg,
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  activeTab: {
    backgroundColor: Colors.gold,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.black,
  },
  submitBtn: {
    marginTop: Spacing.sm,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginTop: Spacing.base,
  },
  hintLink: {
    color: Colors.gold,
    fontWeight: '600',
  },
  footer: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
    marginTop: Spacing.xl,
    letterSpacing: 2,
  },
});
