import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { GoldButton } from '../../components/common/GoldButton';
import { GoldInput } from '../../components/common/GoldInput';
import { useAuthStore } from '../../store/authStore';
import { isSupabaseConfigured } from '../../lib/supabase';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { signIn, signUp } = useAuthStore();

  const supabaseReady = isSupabaseConfigured();

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    if (mode === 'register' && !fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    setLoading(true);
    try {
      const { error } =
        mode === 'login'
          ? await signIn(email.trim(), password)
          : await signUp(email.trim(), password, fullName.trim());

      if (error) {
        setErrorMsg(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const { error } = await signIn('demo@africa2027.com', 'demo1234');
      if (error) setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Layered luxury background */}
      <LinearGradient
        colors={[Colors.safariGreenDark, '#0A1208', Colors.black, '#0F0B00']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Atmospheric gold glow top-right */}
      <View style={styles.glowTopRight} />
      {/* Atmospheric amber glow bottom-left */}
      <View style={styles.glowBottomLeft} />

      {/* Top gold accent bar */}
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

          {/* Demo Banner */}
          {!supabaseReady && (
            <View style={styles.demoBanner}>
              <LinearGradient
                colors={[Colors.safariGreen + '40', Colors.safariGreenDark + '80']}
                style={styles.demoBannerGrad}
              >
                <Text style={styles.demoBannerTitle}>⚡ Preview Mode</Text>
                <Text style={styles.demoBannerBody}>
                  Connect Supabase to enable accounts. Add{'\n'}
                  <Text style={styles.demoBannerBold}>EXPO_PUBLIC_SUPABASE_URL</Text> &{' '}
                  <Text style={styles.demoBannerBold}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>{'\n'}
                  in Vercel → Settings → Environment Variables.
                </Text>
                <View style={styles.demoCreds}>
                  <Text style={styles.demoCredsLabel}>Demo credentials</Text>
                  <Text style={styles.demoCredsValue}>demo@africa2027.com / demo1234</Text>
                </View>
                <TouchableOpacity style={styles.demoQuickBtn} onPress={handleDemoLogin}>
                  <LinearGradient
                    colors={['#F0CC50', '#D4AF37', '#A8860A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.demoQuickGrad}
                  >
                    <Text style={styles.demoQuickBtnText}>▶ Enter Preview</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Auth Form */}
          <View style={styles.formWrapper}>
            <LinearGradient
              colors={[Colors.safariGreen + '30', Colors.cardBg, Colors.safariGreenDark + '20']}
              style={styles.formGrad}
            >
              {/* Tab switcher */}
              <View style={styles.tabRow}>
                {(['login', 'register'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => { setMode(t); setErrorMsg(''); }}
                    style={[styles.tab, mode === t && styles.activeTab]}
                  >
                    {mode === t && (
                      <LinearGradient
                        colors={['#F0CC50', '#D4AF37', '#A8860A']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    )}
                    <Text style={[styles.tabText, mode === t && styles.activeTabText]}>
                      {t === 'login' ? '✈️  Sign In' : '🌍  Join Trip'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {mode === 'register' && (
                <GoldInput
                  label="Full Name"
                  placeholder="Your full name"
                  value={fullName}
                  onChangeText={(v) => { setFullName(v); setErrorMsg(''); }}
                  autoCapitalize="words"
                  icon="👤"
                />
              )}

              <GoldInput
                label="Email Address"
                placeholder="your@email.com"
                value={email}
                onChangeText={(v) => { setEmail(v); setErrorMsg(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                icon="✉️"
              />

              <GoldInput
                label="Password"
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
                title={mode === 'login' ? 'Enter the Expedition' : 'Join the Adventure'}
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitBtn}
                size="lg"
              />

              <Text style={styles.hint}>
                {mode === 'login' ? 'New traveler? ' : 'Already have access? '}
                <Text
                  style={styles.hintLink}
                  onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrorMsg(''); }}
                >
                  {mode === 'login' ? 'Join the trip' : 'Sign in'}
                </Text>
              </Text>
            </LinearGradient>
          </View>

          {/* Footer tagline */}
          <View style={styles.footerBlock}>
            <Text style={styles.footerTagline}>
              Safaris & Sunsets  •  Culture & Connection{'\n'}Celebration & Relaxation
            </Text>
            <Text style={styles.footerSub}>Private • Secure • Exclusive</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom gold line */}
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
  topAccentLine: {
    flex: 1,
  },
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

  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.base,
  },
  safari: {
    fontSize: 64,
    marginBottom: Spacing.sm,
  },
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
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gold + '50',
  },
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
  tagText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  tagDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold + '60',
  },
  dates: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.sm,
    letterSpacing: 1,
    marginTop: Spacing.xs,
  },

  // Demo Banner
  demoBanner: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.safariGreenLight + '40',
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  demoBannerGrad: {
    padding: Spacing.base,
  },
  demoBannerTitle: {
    color: Colors.gold,
    fontSize: Typography.sizes.md,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  demoBannerBody: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  demoBannerBold: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  demoCreds: {
    backgroundColor: Colors.black + '60',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  demoCredsLabel: {
    color: Colors.gold,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  demoCredsValue: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
  },
  demoQuickBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  demoQuickGrad: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  demoQuickBtnText: {
    color: Colors.black,
    fontSize: Typography.sizes.md,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Form
  formWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginBottom: Spacing.xl,
  },
  formGrad: {
    padding: Spacing.xl,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    backgroundColor: Colors.black + '60',
    borderRadius: BorderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  activeTab: {},
  tabText: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.black,
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
    fontWeight: '700',
  },

  // Footer
  footerBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
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
