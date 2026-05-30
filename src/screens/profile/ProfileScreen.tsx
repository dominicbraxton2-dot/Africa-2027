import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { GoldButton } from '../../components/common/GoldButton';
import { GoldInput } from '../../components/common/GoldInput';
import { useAuthStore } from '../../store/authStore';
import { supabase, TABLES, BUCKETS, isSupabaseConfigured } from '../../lib/supabase';

interface Props {
  navigation: any;
}

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

export function ProfileScreen({ navigation }: Props) {
  const { user, signOut, refreshUser, updateAvatar } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Profile picture
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Contact
  const [phone, setPhone] = useState(user?.phone || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');

  // Travel documents
  const [passportNumber, setPassportNumber] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');

  useEffect(() => {
    loadTravelerProfile();
  }, [user?.id]);

  const loadTravelerProfile = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from(TABLES.TRAVELERS)
      .select('*')
      .eq('profile_id', user.id)
      .single();

    if (data) {
      setPassportNumber(data.passport_number || '');
      setNationality(data.nationality || '');
      setDob(data.date_of_birth || '');
      setDietaryRestrictions(data.dietary_restrictions || '');
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await supabase.from(TABLES.PROFILES).update({ phone, instagram }).eq('id', user.id);

      await supabase.from(TABLES.TRAVELERS).upsert({
        profile_id: user.id,
        passport_number: passportNumber,
        nationality,
        date_of_birth: dob,
        dietary_restrictions: dietaryRestrictions,
      });

      await refreshUser();
      setEditMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar upload ─────────────────────────────────────────────────────────

  const pickAvatar = async (source: 'camera' | 'library') => {
    setShowAvatarPicker(false);
    try {
      if (Platform.OS === 'web') {
        const result = await webPickImage();
        if (result) {
          setAvatarUri(result.uri);
          setAvatarFile(result.file);
          await uploadAvatar(result.uri, result.file);
        }
        return;
      }

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true, aspect: [1, 1] });
        if (!result.canceled && result.assets[0]) {
          setAvatarUri(result.assets[0].uri);
          setAvatarFile(null);
          await uploadAvatar(result.assets[0].uri, null);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85, allowsEditing: true, aspect: [1, 1] });
        if (!result.canceled && result.assets[0]) {
          setAvatarUri(result.assets[0].uri);
          setAvatarFile(null);
          await uploadAvatar(result.assets[0].uri, null);
        }
      }
    } catch {
      // silently ignore picker errors
    }
  };

  const uploadAvatar = async (uri: string, file: File | null) => {
    if (!user?.id || !isSupabaseConfigured()) return;
    setAvatarUploading(true);
    try {
      let blob: Blob;
      if (file instanceof File) {
        blob = file;
      } else {
        const resp = await fetch(uri);
        blob = await resp.blob();
      }

      const ext = blob.type.includes('png') ? 'png' : 'jpg';
      const path = `${user.id}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKETS.PROFILE_PICTURES)
        .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true });

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKETS.PROFILE_PICTURES)
          .getPublicUrl(path);

        // Cache-bust the URL so the image always refreshes
        const bustedUrl = `${publicUrl}?t=${Date.now()}`;
        await supabase.from(TABLES.PROFILES).update({ avatar_url: bustedUrl }).eq('id', user.id);
        updateAvatar(bustedUrl);
      }
    } catch {
      // upload failure is silent — avatar preview still shows
    } finally {
      setAvatarUploading(false);
    }
  };

  const currentAvatarUri = avatarUri || user?.avatar_url || null;

  const initials = (user?.full_name || 'T')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="My Profile"
        onBack={() => navigation.goBack()}
        rightAction={editMode
          ? { label: 'Cancel', onPress: () => { setEditMode(false); setSaveError(''); } }
          : { label: 'Edit', onPress: () => setEditMode(true) }
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {saveSuccess && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✅ Profile saved successfully.</Text>
          </View>
        )}
        {saveError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️  {saveError}</Text>
          </View>
        ) : null}

        {/* Profile Header with Avatar */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => setShowAvatarPicker(true)}
            activeOpacity={0.8}
          >
            {currentAvatarUri ? (
              <Image source={{ uri: currentAvatarUri }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={['#F0CC50', '#D4AF37', '#A8860A']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            )}

            {/* Camera overlay */}
            <View style={styles.avatarEditBadge}>
              {avatarUploading
                ? <Text style={styles.avatarEditIcon}>⏳</Text>
                : <Text style={styles.avatarEditIcon}>📷</Text>
              }
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>⚙️ Trip Admin</Text>
            </View>
          )}
          <Text style={styles.avatarHint}>Tap photo to change</Text>
        </View>

        {/* Contact Information */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Card style={styles.section}>
          {editMode ? (
            <>
              <GoldInput label="Phone" placeholder="+1 555 000 0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon="📞" />
              <GoldInput label="Instagram" placeholder="@yourusername" value={instagram} onChangeText={setInstagram} autoCapitalize="none" icon="📱" />
            </>
          ) : (
            <>
              <InfoRow icon="📞" label="Phone" value={phone || 'Not added'} />
              <InfoRow icon="📱" label="Instagram" value={instagram ? `@${instagram}` : 'Not added'} />
            </>
          )}
        </Card>

        {/* Travel Documents */}
        <Text style={styles.sectionTitle}>Travel Documents</Text>
        <Card style={styles.section}>
          {editMode ? (
            <>
              <GoldInput label="Passport Number" placeholder="A1234567" value={passportNumber} onChangeText={setPassportNumber} icon="🛂" />
              <GoldInput label="Nationality" placeholder="American" value={nationality} onChangeText={setNationality} icon="🌍" />
              <GoldInput label="Date of Birth" placeholder="YYYY-MM-DD" value={dob} onChangeText={setDob} icon="🎂" />
              <GoldInput label="Dietary Restrictions" placeholder="Vegetarian, Halal, etc." value={dietaryRestrictions} onChangeText={setDietaryRestrictions} icon="🥗" multiline />
            </>
          ) : (
            <>
              <InfoRow icon="🛂" label="Passport" value={passportNumber ? (showSensitive ? passportNumber : '••••••••') : 'Not added'} />
              <InfoRow icon="🌍" label="Nationality" value={nationality || 'Not added'} />
              <InfoRow icon="🎂" label="Date of Birth" value={dob ? (showSensitive ? dob : '••/••/••••') : 'Not added'} />
              <InfoRow icon="🥗" label="Dietary" value={dietaryRestrictions || 'None listed'} />
            </>
          )}
        </Card>

        {!editMode && (
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>Show sensitive data</Text>
            <Switch
              value={showSensitive}
              onValueChange={setShowSensitive}
              trackColor={{ true: Colors.gold, false: Colors.borderColor }}
              thumbColor={Colors.white}
            />
          </View>
        )}

        {editMode && (
          <GoldButton
            title="Save Profile"
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: Spacing.base }}
            size="lg"
          />
        )}

        <GoldButton
          title="Sign Out"
          onPress={() => setShowSignOutConfirm(true)}
          variant="ghost"
          style={styles.signOut}
        />

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Avatar source picker */}
      <Modal visible={showAvatarPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowAvatarPicker(false)}
        >
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Update Profile Picture</Text>
            <TouchableOpacity style={styles.pickerOption} onPress={() => pickAvatar('camera')}>
              <Text style={styles.pickerIcon}>📷</Text>
              <Text style={styles.pickerLabel}>
                {Platform.OS === 'web' ? 'Take Photo / Upload' : 'Take Photo'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerOption} onPress={() => pickAvatar('library')}>
              <Text style={styles.pickerIcon}>🖼️</Text>
              <Text style={styles.pickerLabel}>Choose from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pickerOption, styles.pickerCancel]} onPress={() => setShowAvatarPicker(false)}>
              <Text style={[styles.pickerLabel, { color: Colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sign Out confirm */}
      <Modal visible={showSignOutConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Sign Out?</Text>
            <Text style={styles.modalBody}>You will need to sign in again to access the expedition.</Text>
            <View style={styles.modalActions}>
              <GoldButton title="Cancel" onPress={() => setShowSignOutConfirm(false)} variant="outline" style={{ flex: 1 }} />
              <GoldButton
                title="Sign Out"
                onPress={() => { setShowSignOutConfirm(false); signOut(); }}
                style={[{ flex: 1, marginLeft: Spacing.sm }, styles.signOutBtn]}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.icon}>{icon}</Text>
      <View style={infoStyles.content}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  icon: { fontSize: 18, marginTop: 2 },
  content: { flex: 1 },
  label: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: { color: Colors.textPrimary, fontSize: Typography.sizes.base },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  scroll: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  successBox: {
    backgroundColor: Colors.success + '18',
    borderWidth: 1,
    borderColor: Colors.success + '60',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  successText: { color: Colors.success, fontSize: Typography.sizes.sm, fontWeight: '600' },
  errorBox: {
    backgroundColor: Colors.error + '18',
    borderWidth: 1,
    borderColor: Colors.error + '60',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  errorText: { color: Colors.error, fontSize: Typography.sizes.sm, fontWeight: '600' },

  // Profile header
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.base,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.gold + '60',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: Colors.gold + '60',
  },
  avatarText: { color: Colors.black, fontSize: Typography.sizes['3xl'], fontWeight: '900' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.safariGreen,
    borderWidth: 2,
    borderColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditIcon: { fontSize: 13 },
  avatarHint: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
    letterSpacing: 0.3,
  },
  name: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: '800', marginBottom: 4 },
  email: { color: Colors.textSecondary, fontSize: Typography.sizes.base, marginBottom: Spacing.sm },
  adminBadge: {
    backgroundColor: Colors.gold + '20',
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  adminBadgeText: { color: Colors.gold, fontSize: Typography.sizes.sm, fontWeight: '700' },

  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: '700', marginBottom: Spacing.sm, marginTop: Spacing.lg },
  section: { gap: 0, padding: Spacing.base },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.surfaceBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginTop: Spacing.base,
  },
  privacyLabel: { color: Colors.textSecondary, fontSize: Typography.sizes.base, fontWeight: '600' },
  signOut: { marginTop: Spacing.xl },

  // Avatar picker sheet
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    borderTopWidth: 1,
    borderColor: Colors.gold + '30',
    gap: Spacing.sm,
  },
  pickerTitle: {
    color: Colors.gold,
    fontSize: Typography.sizes.md,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.surfaceBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  pickerCancel: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  pickerIcon: { fontSize: 22 },
  pickerLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },

  // Sign out modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalBox: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: '800', marginBottom: Spacing.sm },
  modalBody: { color: Colors.textSecondary, fontSize: Typography.sizes.base, lineHeight: 22, marginBottom: Spacing.xl },
  modalActions: { flexDirection: 'row' },
  signOutBtn: { backgroundColor: Colors.error + '20' },
});
