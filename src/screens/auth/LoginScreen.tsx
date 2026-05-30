import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { GoldButton } from '../../components/common/GoldButton';
import { GoldInput } from '../../components/common/GoldInput';
import { useAuthStore } from '../../store/authStore';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { enterWithPassword } = useAuthStore();

  const handleSubmit = () => {
    setErrorMsg('');
    if (!password) {
      setErrorMsg('Please enter the trip password.');
      return;
    }
    setLoading(true);
    const success = enterWithPassword(password);
    setLoading(false);
    if (!success) {
      setErrorMsg('Incorrect trip password. Please try again.');
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.safariGreenDark, '#0A1208', Colors.black, '#0F0B00']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <View style={styles.topAccent}>
        <LinearGradient
          colors={['transparent', Colors.gold, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topAccentLine}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <View style={styles.header}>
            <Text style={styles.safari}>🌍</Text>
            <Text style={styles.cheers}>CHEERS TO</Text>
            <Text style={styles.bigNumber}>40</Text>
            <Text style={styles.years}>YEARS</Text>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>AFRICA EDITION</Text>
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.title}>Andretta's Birthday{'\n'}Expedition</Text>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>🇹🇿 Zanzibar</Text>
              </View>
              <View style={styles.tagDot} />
              <View style={styles.tag}>
                <Text style={styles.tagText}>🇿🇦 Cape Town</Text>
              </View>
            </View>
            <Text style={styles.dates}>January 14 – 27, 2027</Text>
          </View>

          {/* Password Form */}
          <View style={styles.formWrapper}>
            <LinearGradient
              colors={[Colors.safariGreen + '30', Colors.cardBg, Colors.safariGreenDark + '20']}
              style={styles.formGrad}
            >
              <Text style={styles.formTitle}>🔐 Trip Access</Text>
              <Text style={styles.formSubtitle}>Enter the expedition password to join the group</Text>

              <GoldInput
                label="Trip Password"
                placeholder="••••••••"
                value={password}
                onChangeText={(v) => { setPassword(v); setErrorMsg(''); }}
                secureTextEntry
                icon="🔒"
              />

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️  {errorMsg}</Text>
                </View>
              ) : null}

              <GoldButton
                title="Enter the Expedition"
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitBtn}
                size="lg"
              />
            </LinearGradient>
          </View>

          {/* Footer */}
          <View style={styles.footerBlock}>
            <Text style={styles.footerTagline}>
              Safaris & Sunsets  •  Culture & Connection{'\n'}Celebration & Relaxation
            </Text>
            <Text style={styles.footerSub}>Private • Secure • Exclusive</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomAccent}>
        <LinearGradient
          colors={['transparent', Colors.gold + '60', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  flex: { flex: 1 },

  glowTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.gold + '08',
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.amber + '06',
  },

  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 10,
  },
  topAccentLine: { flex: 1 },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },

  // Hero
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.base,
  },
  safari: { fontSize: 64, marginBottom: Spacing.sm },
  cheers: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    letterSpacing: 5,
    marginBottom: -4,
  },
  bigNumber: {
    color: Colors.gold,
    fontSize: 96,
    fontWeight: '900',
    lineHeight: 100,
    letterSpacing: -2,
  },
  years: {
    color: Colors.gold,
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    letterSpacing: 8,
    marginBottom: Spacing.base,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.base,
    width: '100%',
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.gold + '50' },
  dividerText: {
    color: Colors.gold,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 3,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes['2xl'],
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: Spacing.base,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gold + '15',
    borderWidth: 1,
    borderColor: Colors.gold + '40',
  },
  tagText: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: '600' },
  tagDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.gold + '60' },
  dates: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.sm,
    letterSpacing: 1,
    marginTop: Spacing.xs,
  },

  // Form
  formWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginBottom: Spacing.xl,
  },
  formGrad: { padding: Spacing.xl },
  formTitle: {
    color: Colors.gold,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  formSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: Colors.error + '15',
    borderWidth: 1,
    borderColor: Colors.error + '50',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    lineHeight: 20,
  },
  submitBtn: { marginTop: Spacing.sm },

  // Footer
  footerBlock: { alignItems: 'center', gap: Spacing.sm },
  footerTagline: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  footerSub: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
