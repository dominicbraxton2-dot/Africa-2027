import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { GoldButton } from '../../components/common/GoldButton';
import { GoldInput } from '../../components/common/GoldInput';
import { useAuthStore } from '../../store/authStore';
import { supabase, TABLES } from '../../lib/supabase';
import { TravelerProfile } from '../../types';

interface Props {
  navigation: any;
}

export function ProfileScreen({ navigation }: Props) {
  const { user, signOut, refreshUser } = useAuthStore();
  const [profile, setProfile] = useState<Partial<TravelerProfile>>({});
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);

  // Contact fields
  const [phone, setPhone] = useState(user?.phone || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');

  // Profile fields
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

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from(TABLES.TRAVELER_PROFILES)
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setProfile(data);
      setPassportNumber(data.passport_number || '');
      setNationality(data.nationality || '');
      setDob(data.date_of_birth || '');
      setEmergencyName(data.emergency_contact_name || '');
      setEmergencyRelation(data.emergency_contact_relationship || '');
      setEmergencyPhone(data.emergency_contact_phone || '');
      setEmergencyEmail(data.emergency_contact_email || '');
      setAllergies(data.allergies || '');
      setMedications(data.medications || '');
      setBloodType(data.blood_type || '');
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      // Update user contact info
      await supabase.from(TABLES.USERS).update({ phone, instagram }).eq('id', user.id);

      // Upsert traveler profile
      await supabase.from(TABLES.TRAVELER_PROFILES).upsert({
        user_id: user.id,
        full_name: user.full_name,
        passport_number: passportNumber,
        nationality,
        date_of_birth: dob,
        emergency_contact_name: emergencyName,
        emergency_contact_relationship: emergencyRelation,
        emergency_contact_phone: emergencyPhone,
        emergency_contact_email: emergencyEmail,
        allergies,
        medications,
        blood_type: bloodType,
        is_data_encrypted: false,
      });

      await refreshUser();
      setEditMode(false);
      Alert.alert('✅ Saved', 'Your profile has been updated.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
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
          ? { label: 'Cancel', onPress: () => setEditMode(false) }
          : { label: 'Edit', onPress: () => setEditMode(true) }
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile header */}
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

        {/* Contact Info */}
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

        {/* Travel Documents */}
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

        {/* Emergency Contact */}
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

        {/* Medical */}
        <Text style={styles.sectionTitle}>Medical Information</Text>
        <Card style={styles.section}>
          {editMode ? (
            <>
              <GoldInput label="Allergies" placeholder="e.g. Penicillin, shellfish" value={allergies} onChangeText={setAllergies} icon="⚠️" multiline />
              <GoldInput label="Medications" placeholder="Current medications" value={medications} onChangeText={setMedications} icon="💊" multiline />
              <GoldInput label="Blood Type" placeholder="A+, B-, O+, etc." value={bloodType} onChangeText={setBloodType} icon="🩸" />
            </>
          ) : (
            <>
              <InfoRow icon="⚠️" label="Allergies" value={allergies || 'None listed'} />
              <InfoRow icon="💊" label="Medications" value={medications || 'None listed'} />
              <InfoRow icon="🩸" label="Blood Type" value={bloodType || 'Not added'} />
            </>
          )}
        </Card>

        {/* Privacy toggle */}
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

        {/* Save button */}
        {editMode && (
          <GoldButton
            title="Save Profile"
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: Spacing.base }}
            size="lg"
          />
        )}

        {/* Sign Out */}
        <GoldButton
          title="Sign Out"
          onPress={handleSignOut}
          variant="ghost"
          style={styles.signOut}
        />

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
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
  value: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.base,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: Colors.black,
    fontSize: Typography.sizes['2xl'],
    fontWeight: '900',
  },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
    marginBottom: 4,
  },
  email: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    marginBottom: Spacing.sm,
  },
  adminBadge: {
    backgroundColor: Colors.gold + '20',
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  adminBadgeText: {
    color: Colors.gold,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  section: {
    gap: 0,
    padding: Spacing.base,
  },
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
  privacyLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },
  signOut: {
    marginTop: Spacing.xl,
  },
});
