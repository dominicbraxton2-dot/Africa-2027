import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { GoldButton } from '../../components/common/GoldButton';
import { EmptyState } from '../../components/common/EmptyState';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { MemoryItem } from '../../types';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - Spacing.base * 2 - Spacing.sm) / 2;

interface Props {
  navigation: any;
}

export function MemoryScreen({ navigation }: Props) {
  const { memories, fetchMemories, addMemory } = useTripStore();
  const { user } = useAuthStore();
  const [activeDestination, setActiveDestination] = useState<'zanzibar' | 'cape_town' | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [caption, setCaption] = useState('');
  const [destination, setDestination] = useState<'zanzibar' | 'cape_town'>('zanzibar');
  const [pendingImage, setPendingImage] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMemories();
  }, []);

  const filtered = activeDestination === 'all'
    ? memories
    : memories.filter((m) => m.destination === activeDestination);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setPendingImage(result.assets[0]);
      setShowAddModal(true);
    }
  };

  const addNote = () => {
    setPendingImage(null);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!pendingImage && !noteText.trim()) {
      return Alert.alert('Required', 'Please enter a note or select a photo.');
    }

    setSaving(true);
    try {
      const type = pendingImage ? 'photo' : 'note';
      await addMemory({
        user_id: user?.id || '',
        type,
        file_url: pendingImage?.uri,
        note: noteText.trim() || undefined,
        caption: caption.trim() || undefined,
        destination,
      });
      setShowAddModal(false);
      setNoteText('');
      setCaption('');
      setPendingImage(null);
    } finally {
      setSaving(false);
    }
  };

  const renderMemory = ({ item }: { item: MemoryItem }) => {
    const destFlag = item.destination === 'zanzibar' ? '🇹🇿' : '🇿🇦';

    if (item.type === 'photo' && item.file_url) {
      return (
        <TouchableOpacity style={styles.photoCard} activeOpacity={0.9}>
          <Image source={{ uri: item.file_url }} style={styles.photo} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.photoOverlay}
          >
            {item.caption && (
              <Text style={styles.photoCaption} numberOfLines={2}>{item.caption}</Text>
            )}
            <Text style={styles.photoMeta}>
              {destFlag} {format(new Date(item.created_at), 'MMM d')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <Card style={styles.noteCard}>
        <Text style={styles.noteDestFlag}>{destFlag}</Text>
        <Text style={styles.noteText}>{item.note}</Text>
        <Text style={styles.noteMeta}>{format(new Date(item.created_at), 'MMM d, yyyy')}</Text>
      </Card>
    );
  };

  const photos = filtered.filter((m) => m.type === 'photo');
  const notes = filtered.filter((m) => m.type === 'note');

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Memory Vault"
        subtitle="Trip photos & moments"
        onBack={() => navigation.goBack()}
      />

      {/* Destination filter */}
      <View style={styles.tabRow}>
        {([['all', '🌍 All'], ['zanzibar', '🇹🇿 Zanzibar'], ['cape_town', '🇿🇦 Cape Town']] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setActiveDestination(key)}
            style={[styles.tab, activeDestination === key && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeDestination === key && styles.activeTabText]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add buttons */}
      <View style={styles.addRow}>
        <GoldButton title="Add Photo" onPress={pickPhoto} icon="📷" variant="outline" size="sm" style={styles.addBtn} />
        <GoldButton title="Add Note" onPress={addNote} icon="📝" variant="outline" size="sm" style={styles.addBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Photos Grid */}
        {photos.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>📸 Photos ({photos.length})</Text>
            <View style={styles.photosGrid}>
              {photos.map((item) => (
                <View key={item.id} style={{ width: PHOTO_SIZE }}>
                  {renderMemory({ item })}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Notes */}
        {notes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>📝 Notes ({notes.length})</Text>
            <View style={styles.notesList}>
              {notes.map((item) => renderMemory({ item }))}
            </View>
          </>
        )}

        {filtered.length === 0 && (
          <EmptyState
            icon="📸"
            title="No Memories Yet"
            subtitle="Capture photos and notes from your adventure in Zanzibar and Cape Town."
            action={{ label: 'Add First Memory', onPress: pickPhoto }}
          />
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Add Memory Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Memory</Text>
            <TouchableOpacity onPress={() => { setShowAddModal(false); setPendingImage(null); setNoteText(''); }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {pendingImage && (
              <Image source={{ uri: pendingImage.uri }} style={styles.pendingImage} resizeMode="cover" />
            )}

            {!pendingImage && (
              <View style={styles.noteInputContainer}>
                <Text style={styles.fieldLabel}>YOUR MEMORY</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Write about this moment..."
                  placeholderTextColor={Colors.textMuted}
                  value={noteText}
                  onChangeText={setNoteText}
                  multiline
                  numberOfLines={5}
                />
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CAPTION</Text>
              <TextInput
                style={styles.captionInput}
                placeholder="Add a caption (optional)"
                placeholderTextColor={Colors.textMuted}
                value={caption}
                onChangeText={setCaption}
              />
            </View>

            <Text style={styles.fieldLabel}>DESTINATION</Text>
            <View style={styles.destRow}>
              {([['zanzibar', '🇹🇿 Zanzibar'], ['cape_town', '🇿🇦 Cape Town']] as const).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setDestination(key)}
                  style={[styles.destOption, destination === key && styles.destOptionActive]}
                >
                  <Text style={[styles.destOptionText, destination === key && styles.destOptionTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <GoldButton
              title="Save Memory"
              onPress={handleSave}
              loading={saving}
              style={{ marginTop: Spacing.xl }}
              size="lg"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceBg,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  activeTab: {
    backgroundColor: Colors.goldMuted,
    borderColor: Colors.gold,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.gold,
  },
  addRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  addBtn: { flex: 1 },
  scroll: {
    padding: Spacing.base,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.base,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  photoCard: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
  },
  photoCaption: {
    color: Colors.white,
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    lineHeight: 16,
  },
  photoMeta: {
    color: Colors.white + 'AA',
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  notesList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  noteCard: { gap: Spacing.xs },
  noteDestFlag: { fontSize: 22 },
  noteText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    lineHeight: 22,
  },
  noteMeta: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    marginTop: Spacing.xs,
  },
  // Modal
  modal: { flex: 1, backgroundColor: Colors.black },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: '800',
  },
  modalClose: {
    color: Colors.textSecondary,
    fontSize: 22,
  },
  modalScroll: {
    padding: Spacing.xl,
  },
  pendingImage: {
    width: '100%',
    height: 240,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  noteInputContainer: {
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  noteInput: {
    backgroundColor: Colors.surfaceBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    color: Colors.textPrimary,
    padding: Spacing.base,
    fontSize: Typography.sizes.base,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  fieldGroup: { marginBottom: Spacing.xl },
  captionInput: {
    backgroundColor: Colors.surfaceBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    color: Colors.textPrimary,
    padding: Spacing.base,
    fontSize: Typography.sizes.base,
  },
  destRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  destOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.surfaceBg,
  },
  destOptionActive: {
    backgroundColor: Colors.goldMuted,
    borderColor: Colors.gold,
  },
  destOptionText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    fontWeight: '600',
  },
  destOptionTextActive: {
    color: Colors.gold,
  },
});
