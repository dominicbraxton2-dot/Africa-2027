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
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { GoldButton } from '../../components/common/GoldButton';
import { GoldInput } from '../../components/common/GoldInput';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useAuthStore } from '../../store/authStore';

function webPickImage(): Promise<{ uri: string; file: File } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp,image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      resolve({ uri: URL.createObjectURL(file), file });
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { completeProfileSetup } = useAuthStore();

  const [name, setName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const pickPhoto = async () => {
    if (Platform.OS === 'web') {
      const result = await webPickImage();
      if (result) {
        setAvatarUri(result.uri);
        setAvatarFile(result.file);
      }
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.85,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setAvatarFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your name so the group knows who you are.');
      return;
    }
    setErrorMsg('');
    setSaving(true);
    await completeProfileSetup(name.trim(), avatarUri, avatarFile);
    setSaving(false);
  };

  const previewUser = { full_name: name || 'You', avatar_url: avatarUri ?? undefined };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.safariGreenDark, '#0A1208', Colors.black]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glowTop} />

      <View style={styles.topAccent}>
        <LinearGradient
          colors={['transparent', Colors.gold, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 3 }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing['2xl'] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeEmoji}>🌍</Text>
            <Text style={styles.welcomeLabel}>WELCOME TO THE</Text>
            <Text style={styles.welcomeTitle}>Expedition</Text>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>SET UP YOUR PROFILE</Text>
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.welcomeSub}>
              Let the group know who's joining the adventure
            </Text>
          </View>

          {/* Avatar picker */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8} style={styles.avatarTouchable}>
              <UserAvatar user={previewUser} size={100} />
              <LinearGradient
                colors={[Colors.gold + '00', Colors.gold + '40']}
                style={styles.avatarOverlay}
              >
                <Text style={styles.avatarOverlayText}>📷</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>
              {avatarUri ? 'Tap to change photo' : 'Tap to add a photo (optional)'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formWrapper}>
            <LinearGradient
              colors={[Colors.safariGreen + '30', Colors.cardBg, Colors.safariGreenDark + '20']}
              style={styles.formGrad}
            >
              <GoldInput
                label="Your Name"
                placeholder="How should the group know you?"
                value={name}
                onChangeText={(v) => { setName(v); setErrorMsg(''); }}
                autoCapitalize="words"
                icon="👤"
              />

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️  {errorMsg}</Text>
                </View>
              ) : null}

              <GoldButton
                title={saving ? 'Setting up…' : 'Start the Expedition'}
                onPress={handleSubmit}
                loading={saving}
                style={styles.submitBtn}
                size="lg"
              />

              <Text style={styles.skipNote}>
                You can update your profile anytime from the app
              </Text>
            </LinearGradient>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  flex: { flex: 1 },
  glowTop: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.gold + '06',
  },
  topAccent: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },

  header: { alignItems: 'center', marginBottom: Spacing.xl },
  welcomeEmoji: { fontSize: 52, marginBottom: Spacing.sm },
  welcomeLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 4,
  },
  welcomeTitle: {
    color: Colors.gold,
    fontSize: Typography.sizes['3xl'],
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: Spacing.base,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
    marginBottom: Spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.gold + '40' },
  dividerText: {
    color: Colors.gold,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 2,
  },
  welcomeSub: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    textAlign: 'center',
    lineHeight: 22,
  },

  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarTouchable: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.gold + '60',
    marginBottom: Spacing.sm,
  },
  avatarOverlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  avatarOverlayText: { fontSize: 18 },
  avatarHint: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.sm,
  },

  formWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  formGrad: { padding: Spacing.xl },
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
  skipNote: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
