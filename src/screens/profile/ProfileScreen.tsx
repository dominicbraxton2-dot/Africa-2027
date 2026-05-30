import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { GoldButton } from '../../components/common/GoldButton';
import { GoldInput } from '../../components/common/GoldInput';
import { useAuthStore } from '../../store/authStore';
import { supabase, TABLES } from '../../lib/supabase';

interface Props {
  navigation: any;
}

export function ProfileScreen({ navigation }: Props) {
  const { user, signOut, refreshUser } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [phone, setPhone] = useState(user?.phone || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [passportNumber, setPassportNumber] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyEmail, setEmergencyEmail] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [bloodType, setBloodType] = useState('');
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
      setEmergencyName(data.emergency_contact_name || '');
      setEmergencyRelation(data.emergency_contact_relation || '');
      setEmergencyPhone(data.emergency_contact_phone || '');
      setEmergencyEmail(data.emergency_contact_email || '');
      setAllergies(data.allergies || '');
      setMedications(data.medications || '');
      setBloodType(data.blood_type || '');
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
        emergency_contact_name: emergencyName,
        emergency_contact_relation: emergencyRelation,
        emergency_contact_phone: emergencyPhone,
        emergency_contact_email: emergencyEmail,
        allergies,
        medications,
        blood_type: bloodType,
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

        <View style={styles.profileHeader}>
          <LinearGradient
            colors={[Colors.goldLight, Colors.gold, Colors.goldDark]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>⚙️ Trip Admin</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Card style={styles.section}>
          {editMode ? (
            <>
              <GoldInput label="Phone" placeholder="+1 555 000 0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon="📞" />
              <GoldInput label="Instagram" placeholder="@yourusername" value={instagram} onChangeText={setInstagram} autoCapitalize="none" icon="📷" />
            </>
          ) : (
            <>
              <InfoRow icon="📞" label="Phone" value={phone || 'Not added'} />
              <InfoRow icon="📷" label="Instagram" value={instagram ? `@${instagram}` : 'Not added'} />
            </>
          )}
        </Card>

        <Text style={styles.sectionTitle}>Travel Documents</Text>
        <Card style={styles.section}>
          {editMode ? (
            <>
              <GoldInput label="Passport Number" placeholder="A1234567" value={passportNumber} onChangeText={setPassportNumber} icon="🛂" />
              <GoldInput label="Nationality" placeholder="American" value={nationality} onChangeText={setNationality} icon="🌍" />
              <GoldInput label="Date of Birth" placeholder="YYYY-MM-DD" value={dob} onChangeText={setDob} icon="🎂" />
            </>
          ) : (
            <>
              <InfoRow icon="🛂" label="Passport" value={passportNumber ? (showSensitive ? passportNumber : '••••••••') : 'Not added'} />
              <InfoRow icon="🌍" label="Nationality" value={nationality || 'Not added'} />
              <InfoRow icon="🎂" label="Date of Birth" value={dob ? (showSensitive ? dob : '••/••/••••') : 'Not added'} />
            </>
          )}
        </Card>

        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        <Card style={styles.section}>
          {editMode ? (
            <>
              <GoldInput label="Name" placeholder="Contact name" value={emergencyName} onChangeText={setEmergencyName} icon="👤" />
              <GoldInput label="Relationship" placeholder="Mother / Friend" value={emergencyRelation} onChangeText={setEmergencyRelation} icon="🤝" />
              <GoldInput label="Phone" placeholder="+1 555 000 0000" value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" icon="📞" />
              <GoldInput label="Email" placeholder="contact@email.com" value={emergencyEmail} onChangeText={setEmergencyEmail} keyboardType="email-address" autoCapitalize="none" icon="✉️" />
            </>
          ) : (
            <>
              <InfoRow icon="👤" label="Name" value={emergencyName || 'Not added'} />
              <InfoRow icon="🤝" label="Relationship" value={emergencyRelation || 'Not added'} />
              <InfoRow icon="📞" label="Phone" value={emergencyPhone || 'Not added'} />
              <InfoRow icon="✉️" label="Email" value={emergencyEmail || 'Not added'} />
            </>
          )}
        </Card>

        <Text style={styles.sectionTitle}>Medical Information</Text>
        <Card style={styles.section}>
          {editMode ? (
            <>
              <GoldInput label="Allergies" placeholder="e.g. Penicillin, shellfish" value={allergies} onChangeText={setAllergies} icon="⚠️" multiline />
              <GoldInput label="Medications" placeholder="Current medications" value={medications} onChangeText={setMedications} icon="💊" multiline />
              <GoldInput label="Blood Type" placeholder="A+, B-, O+, etc." value={bloodType} onChangeText={setBloodType} icon="🩸" />
              <GoldInput label="Dietary Restrictions" placeholder="Vegetarian, Halal, etc." value={dietaryRestrictions} onChangeText={setDietaryRestrictions} icon="🥗" multiline />
            </>
          ) : (
            <>
              <InfoRow icon="⚠️" label="Allergies" value={allergies || 'None listed'} />
              <InfoRow icon="💊" label="Medications" value={medications || 'None listed'} />
              <InfoRow icon="🩸" label="Blood Type" value={bloodType || 'Not added'} />
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
  profileHeader: { alignItems: 'center', paddingVertical: Spacing.xl, marginBottom: Spacing.base },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  avatarText: { color: Colors.black, fontSize: Typography.sizes['2xl'], fontWeight: '900' },
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
