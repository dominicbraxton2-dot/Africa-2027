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
      <LinearGradient
        colors={[Colors.black, Colors.darkGray, '#1A1008']}
        style={StyleSheet.absoluteFill}
      />
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>✈️</Text>
            <Text style={styles.tagline}>ANDRETTA'S</Text>
            <Text style={styles.title}>40th Birthday{'\n'}Expedition</Text>
            <View style={styles.divider} />
            <Text style={styles.destinations}>🇹🇿 Zanzibar  •  🇿🇦 Cape Town</Text>
          </View>

          {/* Supabase not configured — demo banner */}
          {!supabaseReady && (
            <View style={styles.demoBanner}>
              <Text style={styles.demoBannerTitle}>⚡ Demo Mode</Text>
              <Text style={styles.demoBannerBody}>
                Supabase environment variables are not set in Vercel.{'\n'}
                Use the demo account below to preview the app, or add your{'\n'}
                <Text style={styles.demoBannerBold}>EXPO_PUBLIC_SUPABASE_URL</Text> and{' '}
                <Text style={styles.demoBannerBold}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>{'\n'}
                in Vercel → Settings → Environment Variables.
              </Text>
              <View style={styles.demoCreds}>
                <Text style={styles.demoCredsLabel}>Demo credentials</Text>
                <Text style={styles.demoCredsValue}>Email: demo@africa2027.com</Text>
                <Text style={styles.demoCredsValue}>Password: demo1234</Text>
              </View>
              <TouchableOpacity style={styles.demoQuickBtn} onPress={handleDemoLogin}>
                <Text style={styles.demoQuickBtnText}>▶ Enter Demo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.tabRow}>
              {(['login', 'register'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { setMode(t); setErrorMsg(''); }}
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

            {/* Inline error — works on all platforms including web */}
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
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: Colors.gold,
  },
  bottomAccent: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
    backgroundColor: Colors.gold + '40',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
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
    width: 60, height: 1,
    backgroundColor: Colors.gold,
    marginVertical: Spacing.base,
    opacity: 0.6,
  },
  destinations: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    letterSpacing: 1,
  },
  // Demo banner
  demoBanner: {
    backgroundColor: '#1A1400',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gold + '50',
    padding: Spacing.base,
    marginBottom: Spacing.xl,
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
    backgroundColor: Colors.surfaceBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
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
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
    marginBottom: 2,
  },
  demoQuickBtn: {
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.md,
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
  errorBox: {
    backgroundColor: Colors.error + '18',
    borderWidth: 1,
    borderColor: Colors.error + '60',
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
